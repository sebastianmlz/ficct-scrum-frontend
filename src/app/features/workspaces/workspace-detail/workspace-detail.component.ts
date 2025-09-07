import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../core/models/interfaces';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      } @else if (error()) {
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error loading workspace</h3>
                <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
              </div>
            </div>
          </div>
        </div>
      } @else if (workspace()) {
        <!-- Header with Cover Image -->
        <div class="relative">
          @if (workspace()!.cover_image_url) {
            <div class="h-64 w-full">
              <img [src]="workspace()!.cover_image_url" [alt]="workspace()!.name + ' cover'" class="w-full h-full object-cover">
            </div>
          } @else {
            <div class="h-64 w-full bg-gradient-to-r from-primary to-primary/80"></div>
          }
          
          <!-- Overlay Content -->
          <div class="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div class="max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <a routerLink="/workspaces" class="text-white hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </a>
                  <div>
                    <h1 class="text-4xl font-bold text-white">{{ workspace()!.name }}</h1>
                    <p class="text-xl text-gray-200">{{ workspace()!.slug }}</p>
                    <p class="text-sm text-gray-300 mt-1">{{ workspace()!.organization.name }}</p>
                  </div>
                </div>
                <div class="flex space-x-3">
                  <a
                    [routerLink]="['/workspaces', workspace()!.id, 'edit']"
                    class="bg-white/10 backdrop-blur text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white/20 border border-white/20"
                  >
                    Edit
                  </a>
                  <a
                    [routerLink]="['/workspaces', workspace()!.id, 'members']"
                    class="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                  >
                    Manage Members
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <!-- Status Banner -->
            @if (!workspace()!.is_active) {
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-yellow-700">
                      This workspace is currently inactive.
                    </p>
                  </div>
                </div>
              </div>
            }

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Main Content -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Description Card -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">About</h3>
                    @if (workspace()!.description) {
                      <p class="text-gray-700 whitespace-pre-wrap">{{ workspace()!.description }}</p>
                    } @else {
                      <p class="text-gray-500 italic">No description available.</p>
                    }
                  </div>
                </div>

                <!-- Projects Section -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg leading-6 font-medium text-gray-900">Projects</h3>
                      <a
                        routerLink="/projects/create"
                        [queryParams]="{ workspace: workspace()!.id }"
                        class="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90"
                      >
                        New Project
                      </a>
                    </div>
                    
                    <div class="text-center py-8">
                      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 class="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                      <p class="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
                    </div>
                  </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div class="text-center py-8">
                      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 class="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                      <p class="mt-1 text-sm text-gray-500">Activity will appear here when members start working on projects.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                <!-- Workspace Details -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Details</h3>
                    <dl class="space-y-3">
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                        <dd class="mt-1">
                          <span [class]="getStatusBadgeClass(workspace()!.is_active)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                            {{ workspace()!.is_active ? 'Active' : 'Inactive' }}
                          </span>
                        </dd>
                      </div>
                      
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Type</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ workspace()!.workspace_type | titlecase }}</dd>
                      </div>
                      
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Organization</dt>
                        <dd class="mt-1">
                          <a [routerLink]="['/organizations', workspace()!.organization.id]" class="text-sm text-primary hover:text-primary/80">
                            {{ workspace()!.organization.name }}
                          </a>
                        </dd>
                      </div>
                      
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Members</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ workspace()!.member_count }}</dd>
                      </div>
                      
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Projects</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ workspace()!.project_count }}</dd>
                      </div>
                      
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Created</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ workspace()!.created_at | date:'medium' }}</dd>
                      </div>
                      
                      @if (workspace()!.updated_at !== workspace()!.created_at) {
                        <div>
                          <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                          <dd class="mt-1 text-sm text-gray-900">{{ workspace()!.updated_at | date:'medium' }}</dd>
                        </div>
                      }
                    </dl>
                  </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                      <a
                        routerLink="/projects/create"
                        [queryParams]="{ workspace: workspace()!.id }"
                        class="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Project
                      </a>
                      
                      <a
                        [routerLink]="['/workspaces', workspace()!.id, 'members']"
                        class="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Invite Members
                      </a>
                      
                      <a
                        [routerLink]="['/workspaces', workspace()!.id, 'edit']"
                        class="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Workspace
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      }
    </div>
  `
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);

  workspace = signal<Workspace | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadWorkspace(id);
      }
    });
  }

  async loadWorkspace(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const workspace = await this.workspaceService.getWorkspace(id).toPromise();
      if (workspace) {
        this.workspace.set(workspace);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load workspace');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
