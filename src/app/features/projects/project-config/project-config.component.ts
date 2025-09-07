import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectConfigRequest } from '../../../core/models/interfaces';

@Component({
  selector: 'app-project-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <a [routerLink]="['/projects', projectId]" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Project Settings</h1>
                @if (project()) {
                  <p class="text-sm text-gray-500 mt-1">{{ project()!.name }}</p>
                }
              </div>
            </div>
            @if (project()) {
              <div class="flex items-center space-x-3">
                <a
                  [routerLink]="['/projects', projectId, 'edit']"
                  class="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit Project
                </a>
              </div>
            }
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          } @else if (loadError()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error loading project</h3>
                  <p class="mt-1 text-sm text-red-700">{{ loadError() }}</p>
                </div>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <!-- Settings Navigation -->
              <div class="lg:col-span-1">
                <nav class="space-y-1">
                  <button
                    (click)="setActiveTab('general')"
                    [class]="getTabClass('general')"
                    class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  >
                    <svg class="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    General Settings
                  </button>
                  
                  <button
                    (click)="setActiveTab('features')"
                    [class]="getTabClass('features')"
                    class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  >
                    <svg class="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Features
                  </button>
                  
                  <button
                    (click)="setActiveTab('notifications')"
                    [class]="getTabClass('notifications')"
                    class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  >
                    <svg class="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM11 17H7l4 4v-4zM7 7h5l-5-5v5zM17 7h-5l5-5v5z" />
                    </svg>
                    Notifications
                  </button>
                  
                  <button
                    (click)="setActiveTab('integrations')"
                    [class]="getTabClass('integrations')"
                    class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  >
                    <svg class="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Integrations
                  </button>
                  
                  <button
                    (click)="setActiveTab('danger')"
                    [class]="getTabClass('danger')"
                    class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  >
                    <svg class="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.262 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Danger Zone
                  </button>
                </nav>
              </div>

              <!-- Settings Content -->
              <div class="lg:col-span-3">
                <!-- General Settings Tab -->
                @if (activeTab() === 'general') {
                  <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                      <h3 class="text-lg font-medium text-gray-900">General Settings</h3>
                      <p class="mt-1 text-sm text-gray-600">
                        Configure basic project settings and preferences.
                      </p>
                    </div>

                    @if (saveError()) {
                      <div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <div class="flex">
                          <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Error saving settings</h3>
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

                    <form [formGroup]="configForm" (ngSubmit)="onSaveConfig()" class="p-6 space-y-6">
                      <div>
                        <label class="text-sm font-medium text-gray-900">Project Visibility</label>
                        <p class="text-sm text-gray-500">Choose who can view this project</p>
                        <div class="mt-2 space-y-2">
                          <div class="flex items-center">
                            <input
                              id="public"
                              type="radio"
                              formControlName="visibility"
                              value="public"
                              class="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label for="public" class="ml-3 block text-sm text-gray-700">
                              <span class="font-medium">Public</span> - Anyone can view this project
                            </label>
                          </div>
                          <div class="flex items-center">
                            <input
                              id="internal"
                              type="radio"
                              formControlName="visibility"
                              value="internal"
                              class="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label for="internal" class="ml-3 block text-sm text-gray-700">
                              <span class="font-medium">Internal</span> - Only organization members can view
                            </label>
                          </div>
                          <div class="flex items-center">
                            <input
                              id="private"
                              type="radio"
                              formControlName="visibility"
                              value="private"
                              class="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label for="private" class="ml-3 block text-sm text-gray-700">
                              <span class="font-medium">Private</span> - Only project members can view
                            </label>
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div class="flex items-center justify-between">
                          <div>
                            <label class="text-sm font-medium text-gray-900">Allow Comments</label>
                            <p class="text-sm text-gray-500">Enable commenting on tasks and issues</p>
                          </div>
                          <input
                            type="checkbox"
                            formControlName="allow_comments"
                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                        </div>

                        <div class="flex items-center justify-between">
                          <div>
                            <label class="text-sm font-medium text-gray-900">Allow Attachments</label>
                            <p class="text-sm text-gray-500">Allow file uploads on tasks</p>
                          </div>
                          <input
                            type="checkbox"
                            formControlName="allow_attachments"
                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                        </div>

                        <div class="flex items-center justify-between">
                          <div>
                            <label class="text-sm font-medium text-gray-900">Time Tracking</label>
                            <p class="text-sm text-gray-500">Enable time logging on tasks</p>
                          </div>
                          <input
                            type="checkbox"
                            formControlName="enable_time_tracking"
                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                        </div>

                        <div class="flex items-center justify-between">
                          <div>
                            <label class="text-sm font-medium text-gray-900">Auto Archive</label>
                            <p class="text-sm text-gray-500">Archive completed tasks automatically</p>
                          </div>
                          <input
                            type="checkbox"
                            formControlName="auto_archive_completed"
                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div class="pt-6 border-t border-gray-200">
                        <div class="flex justify-end">
                          <button
                            type="submit"
                            [disabled]="saving()"
                            class="bg-primary border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
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
                      </div>
                    </form>
                  </div>
                }

                <!-- Features Tab -->
                @if (activeTab() === 'features') {
                  <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                      <h3 class="text-lg font-medium text-gray-900">Feature Settings</h3>
                      <p class="mt-1 text-sm text-gray-600">
                        Configure which features are enabled for this project.
                      </p>
                    </div>
                    
                    <div class="p-6">
                      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between">
                            <div>
                              <h4 class="text-sm font-medium text-gray-900">Task Management</h4>
                              <p class="text-sm text-gray-500">Create and manage tasks</p>
                            </div>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between">
                            <div>
                              <h4 class="text-sm font-medium text-gray-900">Issue Tracking</h4>
                              <p class="text-sm text-gray-500">Track bugs and issues</p>
                            </div>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Coming Soon
                            </span>
                          </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between">
                            <div>
                              <h4 class="text-sm font-medium text-gray-900">Wiki/Documentation</h4>
                              <p class="text-sm text-gray-500">Project documentation</p>
                            </div>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Coming Soon
                            </span>
                          </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between">
                            <div>
                              <h4 class="text-sm font-medium text-gray-900">File Storage</h4>
                              <p class="text-sm text-gray-500">Upload and manage files</p>
                            </div>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Coming Soon
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Notifications Tab -->
                @if (activeTab() === 'notifications') {
                  <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                      <h3 class="text-lg font-medium text-gray-900">Notification Settings</h3>
                      <p class="mt-1 text-sm text-gray-600">
                        Configure when and how team members receive notifications.
                      </p>
                    </div>
                    
                    <div class="p-6 space-y-6">
                      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div class="flex">
                          <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                              Notification settings are managed at the workspace level.
                              <a [routerLink]="['/workspaces', project()?.workspace?.id, 'edit']" class="font-medium underline">
                                Configure workspace notifications
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Integrations Tab -->
                @if (activeTab() === 'integrations') {
                  <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                      <h3 class="text-lg font-medium text-gray-900">Integrations</h3>
                      <p class="mt-1 text-sm text-gray-600">
                        Connect your project with external tools and services.
                      </p>
                    </div>
                    
                    <div class="p-6">
                      <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No integrations available</h3>
                        <p class="mt-1 text-sm text-gray-500">Integrations will be available in a future update.</p>
                      </div>
                    </div>
                  </div>
                }

                <!-- Danger Zone Tab -->
                @if (activeTab() === 'danger') {
                  <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-red-200 bg-red-50">
                      <h3 class="text-lg font-medium text-red-900">Danger Zone</h3>
                      <p class="mt-1 text-sm text-red-600">
                        These actions are irreversible. Please be careful.
                      </p>
                    </div>
                    
                    <div class="p-6 space-y-6">
                      <div class="border border-red-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="text-sm font-medium text-gray-900">Archive Project</h4>
                            <p class="text-sm text-gray-500 mt-1">
                              Archive this project. It will be hidden from the main project list but can be restored later.
                            </p>
                          </div>
                          <button
                            type="button"
                            (click)="archiveProject()"
                            [disabled]="!project()?.is_active"
                            class="ml-4 bg-yellow-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Archive Project
                          </button>
                        </div>
                      </div>

                      <div class="border border-red-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="text-sm font-medium text-gray-900">Delete Project</h4>
                            <p class="text-sm text-gray-500 mt-1">
                              Permanently delete this project and all its data. This action cannot be undone.
                            </p>
                          </div>
                          <button
                            type="button"
                            (click)="confirmDeleteProject()"
                            class="ml-4 bg-red-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete Project
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class ProjectConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  projectId: string = '';
  project = signal<Project | null>(null);
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  activeTab = signal<string>('general');

  configForm: FormGroup = this.fb.group({
    visibility: ['internal'],
    allow_comments: [true],
    allow_attachments: [true],
    enable_time_tracking: [true],
    auto_archive_completed: [false]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject();
      }
    });
  }

  async loadProject(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const project = await this.projectService.getProject(this.projectId).toPromise();
      if (project) {
        this.project.set(project);
        // In a real app, you would load the project configuration from the API
        // For now, we'll use default values
      }
    } catch (error: any) {
      this.loadError.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    this.saveError.set(null);
    this.successMessage.set(null);
  }

  getTabClass(tab: string): string {
    const isActive = this.activeTab() === tab;
    return isActive
      ? 'bg-primary text-white hover:bg-primary/90'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  }

  async onSaveConfig(): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    try {
      // In a real app, you would call the project configuration API endpoint
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.successMessage.set('Project settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to save project settings');
    } finally {
      this.saving.set(false);
    }
  }

  async archiveProject(): Promise<void> {
    if (!confirm('Are you sure you want to archive this project? It will be hidden from the main project list.')) {
      return;
    }

    try {
      // In a real app, you would call the archive API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to archive project');
    }
  }

  confirmDeleteProject(): void {
    const projectName = this.project()?.name || 'this project';
    const confirmation = prompt(
      `This action cannot be undone. Type "${projectName}" to confirm deletion:`
    );

    if (confirmation === projectName) {
      this.deleteProject();
    } else if (confirmation !== null) {
      alert('Project name does not match. Deletion cancelled.');
    }
  }

  async deleteProject(): Promise<void> {
    try {
      await this.projectService.deleteProject(this.projectId).toPromise();
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to delete project');
    }
  }
}
