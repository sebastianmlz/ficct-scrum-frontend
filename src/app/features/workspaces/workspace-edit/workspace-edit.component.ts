import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { Workspace, WorkspaceRequest, Organization } from '../../../core/models/interfaces';
import { WorkspaceTypeEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-workspace-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center space-x-4">
            <a [routerLink]="['/workspaces', workspaceId]" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 class="text-3xl font-bold text-gray-900">Edit Workspace</h1>
          </div>
        </div>
      </header>

      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          } @else if (loadError()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error loading workspace</h3>
                  <p class="mt-1 text-sm text-red-700">{{ loadError() }}</p>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Workspace Information</h2>
                <p class="mt-1 text-sm text-gray-600">
                  Update your workspace details and settings.
                </p>
              </div>

              @if (saveError()) {
                <div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">Error updating workspace</h3>
                      <p class="mt-1 text-sm text-red-700">{{ saveError() }}</p>
                    </div>
                  </div>
                </div>
              }

              @if (successMessage()) {
                <div class="mx-6 mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-green-800">Success</h3>
                      <p class="mt-1 text-sm text-green-700">{{ successMessage() }}</p>
                    </div>
                  </div>
                </div>
              }

              <form [formGroup]="workspaceForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">
                      Workspace Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      placeholder="Enter workspace name"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      [class.border-red-300]="workspaceForm.get('name')?.invalid && workspaceForm.get('name')?.touched"
                    />
                    @if (workspaceForm.get('name')?.invalid && workspaceForm.get('name')?.touched) {
                      <p class="mt-1 text-sm text-red-600">Workspace name is required</p>
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
                      placeholder="workspace-url-slug"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      [class.border-red-300]="workspaceForm.get('slug')?.invalid && workspaceForm.get('slug')?.touched"
                    />
                    @if (workspaceForm.get('slug')?.invalid && workspaceForm.get('slug')?.touched) {
                      <p class="mt-1 text-sm text-red-600">
                        @if (workspaceForm.get('slug')?.errors?.['required']) {
                          URL slug is required
                        }
                        @if (workspaceForm.get('slug')?.errors?.['pattern']) {
                          URL slug can only contain lowercase letters, numbers, and hyphens
                        }
                      </p>
                    }
                  </div>
                </div>

                <div>
                  <label for="organization" class="block text-sm font-medium text-gray-700">
                    Organization *
                  </label>
                  <select
                    id="organization"
                    formControlName="organization"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    [class.border-red-300]="workspaceForm.get('organization')?.invalid && workspaceForm.get('organization')?.touched"
                  >
                    <option value="">Select organization...</option>
                    @for (org of organizations(); track org.id) {
                      <option [value]="org.id">{{ org.name }}</option>
                    }
                  </select>
                  @if (workspaceForm.get('organization')?.invalid && workspaceForm.get('organization')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Organization selection is required</p>
                  }
                </div>

                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    formControlName="description"
                    rows="3"
                    placeholder="Describe your workspace..."
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  ></textarea>
                </div>

                <div>
                  <label for="workspaceType" class="block text-sm font-medium text-gray-700">
                    Workspace Type
                  </label>
                  <select
                    id="workspaceType"
                    formControlName="workspace_type"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    @for (type of workspaceTypes; track type.value) {
                      <option [value]="type.value">{{ type.label }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
                  
                  @if (currentCoverUrl()) {
                    <div class="mb-4">
                      <p class="text-sm text-gray-600 mb-2">Current cover:</p>
                      <img [src]="currentCoverUrl()" alt="Current cover" class="h-24 w-36 object-cover rounded-lg">
                    </div>
                  }

                  <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div class="space-y-1 text-center">
                      @if (selectedFile) {
                        <div class="flex items-center justify-center">
                          <img [src]="previewUrl" alt="Cover preview" class="h-24 w-36 object-cover rounded-lg">
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
                          <label for="coverUpload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                            <span>Upload a new cover</span>
                            <input id="coverUpload" type="file" class="sr-only" accept="image/*" (change)="onFileSelected($event)">
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
                    Active workspace
                  </label>
                </div>

                <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <a
                    [routerLink]="['/workspaces', workspaceId]"
                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Cancel
                  </a>
                  <button
                    type="submit"
                    [disabled]="workspaceForm.invalid || saving()"
                    class="bg-primary border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (saving()) {
                      <div class="flex items-center">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    } @else {
                      Save Changes
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class WorkspaceEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private organizationService = inject(OrganizationService);

  workspaceId: string = '';
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  organizations = signal<Organization[]>([]);
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentCoverUrl = signal<string | null>(null);

  workspaceTypes = [
    { value: WorkspaceTypeEnum.TEAM, label: 'Team' },
    { value: WorkspaceTypeEnum.PROJECT, label: 'Project' },
    { value: WorkspaceTypeEnum.DEPARTMENT, label: 'Department' },
    { value: WorkspaceTypeEnum.OTHER, label: 'Other' }
  ];

  workspaceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    organization: ['', [Validators.required]],
    description: [''],
    workspace_type: [''],
    is_active: [true]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.workspaceId = params['id'];
      if (this.workspaceId) {
        this.loadOrganizations();
        this.loadWorkspace();
      }
    });
  }

  async loadOrganizations(): Promise<void> {
    try {
      const response = await this.organizationService.getOrganizations().toPromise();
      if (response) {
        this.organizations.set(response.results);
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
    }
  }

  async loadWorkspace(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const workspace = await this.workspaceService.getWorkspace(this.workspaceId).toPromise();
      if (workspace) {
        this.populateForm(workspace);
        this.currentCoverUrl.set(workspace.cover_image_url || null);
      }
    } catch (error: any) {
      this.loadError.set(error.error?.message || 'Failed to load workspace');
    } finally {
      this.loading.set(false);
    }
  }

  populateForm(workspace: Workspace): void {
    this.workspaceForm.patchValue({
      name: workspace.name,
      slug: workspace.slug,
      organization: workspace.organization.id,
      description: workspace.description,
      workspace_type: workspace.workspace_type,
      is_active: workspace.is_active
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
    if (this.workspaceForm.invalid) {
      this.workspaceForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    try {
      const formData: WorkspaceRequest = {
        name: this.workspaceForm.value.name,
        slug: this.workspaceForm.value.slug,
        organization: this.workspaceForm.value.organization,
        description: this.workspaceForm.value.description || undefined,
        workspace_type: this.workspaceForm.value.workspace_type || undefined,
        is_active: this.workspaceForm.value.is_active,
        cover_image: this.selectedFile || undefined
      };

      const workspace = await this.workspaceService.updateWorkspace(this.workspaceId, formData).toPromise();
      if (workspace) {
        this.successMessage.set('Workspace updated successfully!');
        this.currentCoverUrl.set(workspace.cover_image_url || null);
        this.selectedFile = null;
        this.previewUrl = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      }
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to update workspace');
    } finally {
      this.saving.set(false);
    }
  }
}
