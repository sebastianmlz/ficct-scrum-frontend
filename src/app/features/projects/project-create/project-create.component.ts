import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ProjectRequest, Workspace } from '../../../core/models/interfaces';
import { ProjectStatusEnum, ProjectPriorityEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center space-x-4">
            <a routerLink="/projects" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 class="text-3xl font-bold text-gray-900">Create Project</h1>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Project Information</h2>
              <p class="mt-1 text-sm text-gray-600">
                Create a new project to organize your work and track progress.
              </p>
            </div>

            @if (error()) {
              <div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error creating project</h3>
                    <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
                  </div>
                </div>
              </div>
            }

            <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Left Column -->
                <div class="space-y-6">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">
                      Project Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      placeholder="Enter project name"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      [class.border-red-300]="projectForm.get('name')?.invalid && projectForm.get('name')?.touched"
                    />
                    @if (projectForm.get('name')?.invalid && projectForm.get('name')?.touched) {
                      <p class="mt-1 text-sm text-red-600">Project name is required</p>
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
                      placeholder="project-url-slug"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      [class.border-red-300]="projectForm.get('slug')?.invalid && projectForm.get('slug')?.touched"
                    />
                    @if (projectForm.get('slug')?.invalid && projectForm.get('slug')?.touched) {
                      <p class="mt-1 text-sm text-red-600">
                        @if (projectForm.get('slug')?.errors?.['required']) {
                          URL slug is required
                        }
                        @if (projectForm.get('slug')?.errors?.['pattern']) {
                          URL slug can only contain lowercase letters, numbers, and hyphens
                        }
                      </p>
                    }
                  </div>

                  <div>
                    <label for="workspace" class="block text-sm font-medium text-gray-700">
                      Workspace *
                    </label>
                    <select
                      id="workspace"
                      formControlName="workspace"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      [class.border-red-300]="projectForm.get('workspace')?.invalid && projectForm.get('workspace')?.touched"
                    >
                      <option value="">Select workspace...</option>
                      @for (workspace of workspaces(); track workspace.id) {
                        <option [value]="workspace.id">{{ workspace.name }} ({{ workspace.organization.name }})</option>
                      }
                    </select>
                    @if (projectForm.get('workspace')?.invalid && projectForm.get('workspace')?.touched) {
                      <p class="mt-1 text-sm text-red-600">Workspace selection is required</p>
                    }
                  </div>

                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      formControlName="description"
                      rows="4"
                      placeholder="Describe your project goals and objectives..."
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    ></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label for="status" class="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        formControlName="status"
                        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        @for (status of projectStatuses; track status.value) {
                          <option [value]="status.value">{{ status.label }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label for="priority" class="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        id="priority"
                        formControlName="priority"
                        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        @for (priority of projectPriorities; track priority.value) {
                          <option [value]="priority.value">{{ priority.label }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-6">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label for="startDate" class="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        formControlName="start_date"
                        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label for="dueDate" class="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        id="dueDate"
                        type="date"
                        formControlName="due_date"
                        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label for="budget" class="block text-sm font-medium text-gray-700">
                      Budget
                    </label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="budget"
                        type="number"
                        step="0.01"
                        min="0"
                        formControlName="budget"
                        placeholder="0.00"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label for="estimatedHours" class="block text-sm font-medium text-gray-700">
                      Estimated Hours
                    </label>
                    <input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      formControlName="estimated_hours"
                      placeholder="Total estimated hours"
                      class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label for="coverImage" class="block text-sm font-medium text-gray-700">
                      Cover Image
                    </label>
                    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div class="space-y-1 text-center">
                        @if (selectedFile) {
                          <div class="flex items-center justify-center">
                            <img [src]="previewUrl" alt="Cover preview" class="h-20 w-32 object-cover rounded-lg">
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
                              <span>Upload a file</span>
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
                      Active project
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <a
                  routerLink="/projects"
                  class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  [disabled]="projectForm.invalid || loading()"
                  class="bg-primary border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (loading()) {
                    <div class="flex items-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  } @else {
                    Create Project
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
export class ProjectCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private workspaceService = inject(WorkspaceService);

  loading = signal(false);
  error = signal<string | null>(null);
  workspaces = signal<Workspace[]>([]);
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  projectStatuses = [
    { value: ProjectStatusEnum.PLANNING, label: 'Planning' },
    { value: ProjectStatusEnum.ACTIVE, label: 'Active' },
    { value: ProjectStatusEnum.ON_HOLD, label: 'On Hold' },
    { value: ProjectStatusEnum.COMPLETED, label: 'Completed' },
    { value: ProjectStatusEnum.CANCELLED, label: 'Cancelled' }
  ];

  projectPriorities = [
    { value: ProjectPriorityEnum.LOW, label: 'Low' },
    { value: ProjectPriorityEnum.MEDIUM, label: 'Medium' },
    { value: ProjectPriorityEnum.HIGH, label: 'High' },
    { value: ProjectPriorityEnum.CRITICAL, label: 'Critical' }
  ];

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    workspace: ['', [Validators.required]],
    description: [''],
    status: [ProjectStatusEnum.PLANNING],
    priority: [ProjectPriorityEnum.MEDIUM],
    start_date: [''],
    due_date: [''],
    budget: [''],
    estimated_hours: [''],
    is_active: [true]
  });

  constructor() {
    // Auto-generate slug from name
    this.projectForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.projectForm.get('slug')?.touched) {
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        this.projectForm.patchValue({ slug });
      }
    });
  }

  ngOnInit(): void {
    this.loadWorkspaces();
    
    // Check if workspace is pre-selected via query param
    this.route.queryParams.subscribe(params => {
      if (params['workspace']) {
        this.projectForm.patchValue({ workspace: params['workspace'] });
      }
    });
  }

  async loadWorkspaces(): Promise<void> {
    try {
      const response = await this.workspaceService.getWorkspaces().toPromise();
      if (response) {
        this.workspaces.set(response.results);
      }
    } catch (error: any) {
      this.error.set('Failed to load workspaces');
    }
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
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formData: ProjectRequest = {
        name: this.projectForm.value.name,
        slug: this.projectForm.value.slug,
        workspace: this.projectForm.value.workspace,
        description: this.projectForm.value.description || undefined,
        status: this.projectForm.value.status,
        priority: this.projectForm.value.priority,
        start_date: this.projectForm.value.start_date || undefined,
        due_date: this.projectForm.value.due_date || undefined,
        budget: this.projectForm.value.budget || undefined,
        estimated_hours: this.projectForm.value.estimated_hours || undefined,
        is_active: this.projectForm.value.is_active,
        cover_image: this.selectedFile || undefined
      };

      const project = await this.projectService.createProject(formData).toPromise();
      if (project) {
        this.router.navigate(['/projects', project.id]);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to create project');
    } finally {
      this.loading.set(false);
    }
  }
}
