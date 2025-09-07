import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace, PaginatedWorkspaceList, PaginationParams } from '../../../core/models/interfaces';

@Component({
  selector: 'app-workspaces-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center">
            <h1 class="text-3xl font-bold text-gray-900">Workspaces</h1>
            <a 
              routerLink="/workspaces/create"
              class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 font-medium"
            >
              Create Workspace
            </a>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Search and Filter Bar -->
          <div class="bg-white p-6 rounded-lg shadow mb-6">
            <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="flex gap-4 items-end">
              <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
                  Search Workspaces
                </label>
                <input
                  id="search"
                  type="text"
                  formControlName="search"
                  placeholder="Search by name or description..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label for="workspaceType" class="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  id="workspaceType"
                  formControlName="workspace_type"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  (change)="onSearch()"
                >
                  <option value="">All Types</option>
                  <option value="team">Team</option>
                  <option value="project">Project</option>
                  <option value="department">Department</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label for="ordering" class="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  id="ordering"
                  formControlName="ordering"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  (change)="onSearch()"
                >
                  <option value="name">Name A-Z</option>
                  <option value="-name">Name Z-A</option>
                  <option value="created_at">Oldest First</option>
                  <option value="-created_at">Newest First</option>
                </select>
              </div>
              <button
                type="submit"
                class="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 font-medium"
              >
                Search
              </button>
            </form>
          </div>

          <!-- Loading State -->
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }

          <!-- Error State -->
          @if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error loading workspaces</h3>
                  <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Workspaces Grid -->
          @if (workspaces().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              @for (workspace of workspaces(); track workspace.id) {
                <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center">
                        @if (workspace.cover_image_url) {
                          <img [src]="workspace.cover_image_url" [alt]="workspace.name + ' cover'" class="w-10 h-10 rounded mr-3 object-cover">
                        } @else {
                          <div class="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-medium mr-3">
                            {{ workspace.name.charAt(0).toUpperCase() }}
                          </div>
                        }
                        <div>
                          <h3 class="text-lg font-medium text-gray-900">{{ workspace.name }}</h3>
                          <p class="text-sm text-gray-500">{{ workspace.slug }}</p>
                        </div>
                      </div>
                      <span [class]="getStatusBadgeClass(workspace.is_active)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ workspace.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>

                    @if (workspace.description) {
                      <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ workspace.description }}</p>
                    }

                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{{ workspace.member_count }} members</span>
                      <span>{{ workspace.project_count }} projects</span>
                    </div>

                    <div class="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span>{{ workspace.workspace_type | titlecase }}</span>
                      <span>{{ workspace.organization.name }}</span>
                    </div>

                    <div class="flex space-x-2">
                      <a
                        [routerLink]="['/workspaces', workspace.id]"
                        class="flex-1 text-center bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                      >
                        View Details
                      </a>
                      <a
                        [routerLink]="['/workspaces', workspace.id, 'members']"
                        class="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                      >
                        Members
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (paginationData() && (paginationData()!.count > workspaces().length)) {
              <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <p class="text-sm text-gray-700">
                      Showing {{ ((currentPage() - 1) * 10) + 1 }} to {{ Math.min(currentPage() * 10, paginationData()!.count) }} of {{ paginationData()!.count }} results
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      (click)="loadPage(currentPage() - 1)"
                      [disabled]="!paginationData()?.previous"
                      class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      (click)="loadPage(currentPage() + 1)"
                      [disabled]="!paginationData()?.next"
                      class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            }
          } @else if (!loading()) {
            <div class="text-center py-12">
              <div class="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No workspaces found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating your first workspace.</p>
              <div class="mt-6">
                <a
                  routerLink="/workspaces/create"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Create Workspace
                </a>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class WorkspacesListComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private fb = inject(FormBuilder);

  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  paginationData = signal<PaginatedWorkspaceList | null>(null);
  currentPage = signal(1);

  searchForm: FormGroup = this.fb.group({
    search: [''],
    workspace_type: [''],
    ordering: ['-created_at']
  });

  Math = Math;

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  async loadWorkspaces(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.workspaceService.getWorkspaces(params).toPromise();
      if (response) {
        this.workspaces.set(response.results);
        this.paginationData.set(response);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load workspaces');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    const searchParams: PaginationParams = {
      page: 1,
      search: this.searchForm.value.search || undefined,
      workspace_type: this.searchForm.value.workspace_type || undefined,
      ordering: this.searchForm.value.ordering || undefined
    };
    
    this.currentPage.set(1);
    this.loadWorkspaces(searchParams);
  }

  loadPage(page: number): void {
    if (page < 1) return;
    
    const searchParams: PaginationParams = {
      page,
      search: this.searchForm.value.search || undefined,
      workspace_type: this.searchForm.value.workspace_type || undefined,
      ordering: this.searchForm.value.ordering || undefined
    };
    
    this.currentPage.set(page);
    this.loadWorkspaces(searchParams);
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
