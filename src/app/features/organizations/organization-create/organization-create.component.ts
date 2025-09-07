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
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center space-x-4">
            <a routerLink="/organizations" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 class="text-3xl font-bold text-gray-900">Create Organization</h1>
          </div>
        </div>
      </header>

      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Organization Information</h2>
              <p class="mt-1 text-sm text-gray-600">
                Create a new organization to manage your teams and projects.
              </p>
            </div>

            @if (error) {
              <div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error creating organization</h3>
                    <p class="mt-1 text-sm text-red-700">{{ error }}</p>
                  </div>
                </div>
              </div>
            }

            <form [formGroup]="organizationForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700">
                    Organization Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    formControlName="name"
                    placeholder="Enter organization name"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    [class.border-red-300]="organizationForm.get('name')?.invalid && organizationForm.get('name')?.touched"
                  />
                  @if (organizationForm.get('name')?.invalid && organizationForm.get('name')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Organization name is required</p>
                  }
                </div>

                <div>
                  <label for="slug" class="block text-sm font-medium text-gray-700">
                    URL Slug *
                  </label>
                  <input
                    id="slug"
                    type="text"
                    formControlName="slug"
                    placeholder="organization-url-slug"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    [class.border-red-300]="organizationForm.get('slug')?.invalid && organizationForm.get('slug')?.touched"
                  />
                  @if (organizationForm.get('slug')?.invalid && organizationForm.get('slug')?.touched) {
                    <p class="mt-1 text-sm text-red-600">
                      @if (organizationForm.get('slug')?.errors?.['required']) {
                        URL slug is required
                      }
                      @if (organizationForm.get('slug')?.errors?.['pattern']) {
                        URL slug can only contain lowercase letters, numbers, and hyphens
                      }
                    </p>
                  }
                </div>
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="3"
                  placeholder="Describe your organization..."
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="organizationType" class="block text-sm font-medium text-gray-700">
                    Organization Type
                  </label>
                  <select
                    id="organizationType"
                    formControlName="organization_type"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    @for (type of organizationTypes; track type.value) {
                      <option [value]="type.value">{{ type.label }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label for="subscriptionPlan" class="block text-sm font-medium text-gray-700">
                    Subscription Plan
                  </label>
                  <select
                    id="subscriptionPlan"
                    formControlName="subscription_plan"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select plan...</option>
                    @for (plan of subscriptionPlans; track plan.value) {
                      <option [value]="plan.value">{{ plan.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div>
                <label for="websiteUrl" class="block text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  formControlName="website_url"
                  placeholder="https://example.com"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  [class.border-red-300]="organizationForm.get('website_url')?.invalid && organizationForm.get('website_url')?.touched"
                />
                @if (organizationForm.get('website_url')?.invalid && organizationForm.get('website_url')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Please enter a valid URL</p>
                }
              </div>

              <div>
                <label for="logo" class="block text-sm font-medium text-gray-700">
                  Organization Logo
                </label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div class="space-y-1 text-center">
                    @if (selectedFile) {
                      <div class="flex items-center justify-center">
                        <img [src]="previewUrl" alt="Logo preview" class="h-16 w-16 object-cover rounded-lg">
                        <button
                          type="button"
                          (click)="removeFile()"
                          class="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    } @else {
                      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <div class="flex text-sm text-gray-600">
                        <label for="logoUpload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                          <span>Upload a file</span>
                          <input id="logoUpload" type="file" class="sr-only" accept="image/*" (change)="onFileSelected($event)">
                        </label>
                        <p class="pl-1">or drag and drop</p>
                      </div>
                      <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    }
                  </div>
                </div>
              </div>

              <div class="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  formControlName="is_active"
                  class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label for="isActive" class="ml-2 block text-sm text-gray-900">
                  Active organization
                </label>
              </div>

              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <a
                  routerLink="/organizations"
                  class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  [disabled]="organizationForm.invalid || loading"
                  class="bg-primary border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (loading) {
                    <div class="flex items-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  } @else {
                    Create Organization
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `
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
