import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization, OrganizationRequest } from '../../../core/models/interfaces';
import { OrganizationTypeEnum, SubscriptionPlanEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-organization-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './organization-edit.component.html'
})
export class OrganizationEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  organizationId: string = '';
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentLogoUrl = signal<string | null>(null);

  organizationTypes = [
    { value: OrganizationTypeEnum.STARTUP, label: 'Startup' },
    { value: OrganizationTypeEnum.CORPORATION, label: 'Corporation' },
    { value: OrganizationTypeEnum.NON_PROFIT, label: 'Non-Profit' },
    { value: OrganizationTypeEnum.GOVERNMENT, label: 'Government' },
    { value: OrganizationTypeEnum.EDUCATIONAL, label: 'Educational' },
    { value: OrganizationTypeEnum.OTHER, label: 'Other' }
  ];

  subscriptionPlans = [
    { value: SubscriptionPlanEnum.FREE, label: 'Free' },
    { value: SubscriptionPlanEnum.BASIC, label: 'Basic' },
    { value: SubscriptionPlanEnum.PREMIUM, label: 'Premium' },
    { value: SubscriptionPlanEnum.ENTERPRISE, label: 'Enterprise' }
  ];

  organizationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    organization_type: [''],
    subscription_plan: [''],
    website_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    is_active: [true]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.organizationId = params['id'];
      if (this.organizationId) {
        this.loadOrganization();
      }
    });
  }

  async loadOrganization(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const organization = await this.organizationService.getOrganization(this.organizationId).toPromise();
      if (organization) {
        this.populateForm(organization);
        this.currentLogoUrl.set(organization.logo_url || null);
      }
    } catch (error: any) {
      this.loadError.set(error.error?.message || 'Failed to load organization');
    } finally {
      this.loading.set(false);
    }
  }

  populateForm(organization: Organization): void {
    this.organizationForm.patchValue({
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      organization_type: organization.organization_type,
      subscription_plan: organization.subscription_plan,
      website_url: organization.website_url,
      is_active: organization.is_active
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async onSubmit(): Promise<void> {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    try {
      const formData: OrganizationRequest = {
        name: this.organizationForm.value.name,
        slug: this.organizationForm.value.slug,
        description: this.organizationForm.value.description || undefined,
        organization_type: this.organizationForm.value.organization_type || undefined,
        subscription_plan: this.organizationForm.value.subscription_plan || undefined,
        website_url: this.organizationForm.value.website_url || undefined,
        is_active: this.organizationForm.value.is_active,
        logo: this.selectedFile || undefined
      };

      const organization = await this.organizationService.updateOrganization(this.organizationId, formData).toPromise();
      if (organization) {
        this.successMessage.set('Organization updated successfully!');
        this.currentLogoUrl.set(organization.logo_url || null);
        this.selectedFile = null;
        this.previewUrl = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      }
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to update organization');
    } finally {
      this.saving.set(false);
    }
  }
}
