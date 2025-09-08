import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationRequest } from '../../../core/models/interfaces';
import { OrganizationTypeEnum, SubscriptionPlanEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-organization-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './organization-create.component.html'
})
export class OrganizationCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  loading = false;
  error: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

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

  constructor() {
    // Auto-generate slug from name
    this.organizationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.organizationForm.get('slug')?.touched) {
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        this.organizationForm.patchValue({ slug });
      }
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

    this.loading = true;
    this.error = null;

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

      const organization = await this.organizationService.createOrganization(formData).toPromise();
      if (organization) {
        this.router.navigate(['/organizations', organization.id]);
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to create organization';
    } finally {
      this.loading = false;
    }
  }
}
