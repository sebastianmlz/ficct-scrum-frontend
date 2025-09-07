import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/store/auth.store';
import { OrganizationService } from '../../core/services/organization.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { ProjectService } from '../../core/services/project.service';
import { Organization, Workspace, Project } from '../../core/models/interfaces';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ErrorBoundaryComponent } from '../../shared/components/error-boundary/error-boundary.component';

interface QuickStat {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

interface RecentProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  team_size: number;
  last_activity: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'project' | 'task' | 'comment' | 'member';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Top Navigation -->
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <!-- Left: Logo & Navigation -->
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center">
                <div class="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span class="ml-2 text-xl font-bold text-gray-900">FICCT-SCRUM</span>
              </div>
              
              <nav class="hidden md:ml-6 md:flex md:space-x-1">
                <a routerLink="/dashboard" class="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
                  Dashboard
                </a>
                <a routerLink="/projects" class="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Projects
                </a>
                <a routerLink="/workspaces" class="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Workspaces
                </a>
                <a routerLink="/organizations" class="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Organizations
                </a>
              </nav>
            </div>

            <!-- Right: Search, Notifications, User Menu -->
            <div class="flex items-center space-x-4">
              <!-- Search -->
              <div class="relative hidden md:block">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input 
                  type="search" 
                  placeholder="Search projects, tasks..." 
                  class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>

              <!-- Notifications -->
              <button class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19H6.5A2.5 2.5 0 014 16.5v-12A2.5 2.5 0 016.5 2h8A2.5 2.5 0 0117 4.5V12"></path>
                </svg>
                <span class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
              </button>

              <!-- User Menu -->
              <div class="relative flex items-center space-x-3">
                <div class="hidden md:block text-right">
                  <p class="text-sm font-medium text-gray-900">{{ authStore.currentUser()?.first_name }} {{ authStore.currentUser()?.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ authStore.currentUser()?.email }}</p>
                </div>
                <button 
                  (click)="toggleUserMenu()"
                  class="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <div class="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-white">
                      {{ (authStore.currentUser()?.first_name || 'U').charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </button>
                
                @if (showUserMenu()) {
                  <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <a routerLink="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile Settings</a>
                    <a routerLink="/admin" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Admin Panel</a>
                    <hr class="my-1">
                    <button (click)="logout()" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      Sign out
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">
            Good {{ getGreeting() }}, {{ authStore.currentUser()?.first_name || 'there' }}! 👋
          </h1>
          <p class="text-gray-600 mt-1">Here's what's happening with your projects today.</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          @for (stat of quickStats(); track stat.label) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">{{ stat.label }}</p>
                  <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
                  <div class="flex items-center mt-2">
                    <svg [class]="'h-4 w-4 mr-1 ' + (stat.changeType === 'increase' ? 'text-green-500' : stat.changeType === 'decrease' ? 'text-red-500' : 'text-gray-400')" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (stat.changeType === 'increase') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      } @else if (stat.changeType === 'decrease') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path>
                      }
                    </svg>
                    <span [class]="'text-xs font-medium ' + (stat.changeType === 'increase' ? 'text-green-600' : stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500')">
                      {{ stat.change }}{{ stat.changeType !== 'neutral' ? '%' : '' }}
                    </span>
                  </div>
                </div>
                <div [class]="'h-12 w-12 rounded-lg flex items-center justify-center ' + getStatColorClasses(stat.color)">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" [innerHTML]="stat.icon"></svg>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Recent Projects -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <a routerLink="/projects" class="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</a>
              </div>
              <div class="p-6">
                @if (recentProjects().length === 0) {
                  <div class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 class="mt-4 text-sm font-medium text-gray-900">No projects yet</h3>
                    <p class="mt-2 text-sm text-gray-500">Get started by creating your first project.</p>
                    <div class="mt-6">
                      <a routerLink="/projects" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Create Project
                      </a>
                    </div>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (project of recentProjects(); track project.id) {
                      <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h3 class="text-sm font-medium text-gray-900">{{ project.name }}</h3>
                            <p class="text-xs text-gray-500 mt-1">{{ project.description }}</p>
                            <div class="flex items-center mt-3 space-x-4">
                              <div class="flex items-center text-xs text-gray-500">
                                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.121 2.121 0 113 3L19.5 12.75 6.375 19.5"></path>
                                </svg>
                                {{ project.team_size }} members
                              </div>
                              <div class="flex items-center text-xs text-gray-500">
                                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {{ project.last_activity }}
                              </div>
                            </div>
                          </div>
                          <div class="ml-4 flex flex-col items-end">
                            <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getProjectStatusClass(project.status)">
                              {{ project.status }}
                            </span>
                            <div class="mt-2 text-right">
                              <div class="text-xs text-gray-500">{{ project.progress }}% complete</div>
                              <div class="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div [class]="'bg-blue-600 h-1.5 rounded-full transition-all duration-300'" [style.width.%]="project.progress"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div class="p-6">
                @if (activityFeed().length === 0) {
                  <div class="text-center py-8">
                    <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="mt-2 text-sm text-gray-500">No recent activity</p>
                  </div>
                } @else {
                  <div class="flow-root">
                    <ul class="-mb-8">
                      @for (activity of activityFeed(); track activity.id; let isLast = $last) {
                        <li>
                          <div class="relative pb-8">
                            @if (!isLast) {
                              <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            }
                            <div class="relative flex space-x-3">
                              <div [class]="'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ' + getActivityTypeColor(activity.type)">
                                <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20" [innerHTML]="getActivityIcon(activity.type)"></svg>
                              </div>
                              <div class="min-w-0 flex-1">
                                <div>
                                  <div class="text-sm">
                                    <span class="font-medium text-gray-900">{{ activity.user }}</span>
                                    <span class="text-gray-600"> {{ activity.action }} </span>
                                    <span class="font-medium text-gray-900">{{ activity.target }}</span>
                                  </div>
                                  <p class="mt-0.5 text-xs text-gray-500">{{ activity.timestamp }}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a routerLink="/projects" class="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <span class="mt-2 text-sm font-medium text-gray-900">New Project</span>
              </a>
              
              <a routerLink="/workspaces" class="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <span class="mt-2 text-sm font-medium text-gray-900">New Workspace</span>
              </a>
              
              <a routerLink="/organizations" class="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                  <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <span class="mt-2 text-sm font-medium text-gray-900">New Organization</span>
              </a>
              
              <a routerLink="/admin" class="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200">
                <div class="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors duration-200">
                  <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <span class="mt-2 text-sm font-medium text-gray-900">Admin Panel</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  public authStore = inject(AuthStore);
  private organizationService = inject(OrganizationService);
  private workspaceService = inject(WorkspaceService);
  private projectService = inject(ProjectService);
  
  // UI State
  showUserMenu = signal(false);
  
  // Loading states
  loading = signal(true);
  statsLoading = signal(true);
  projectsLoading = signal(true);
  activityLoading = signal(true);
  
  // Error states  
  error = signal<string | null>(null);
  statsError = signal<string | null>(null);
  projectsError = signal<string | null>(null);
  activityError = signal<string | null>(null);

  // Data
  quickStats = signal<QuickStat[]>([]);
  recentProjects = signal<RecentProject[]>([]);
  activityFeed = signal<ActivityItem[]>([]);
  
  // Raw API data
  organizations = signal<Organization[]>([]);
  workspaces = signal<Workspace[]>([]);
  projects = signal<Project[]>([]);
  
  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    this.loading.set(true);
    
    try {
      // Load data in parallel
      await Promise.all([
        this.loadStats(),
        this.loadRecentProjects(),
        this.loadActivityFeed()
      ]);
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      this.error.set('Failed to load dashboard data');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadStats(): Promise<void> {
    this.statsLoading.set(true);
    this.statsError.set(null);
    
    try {
      // Load organizations, workspaces, and projects
      const [orgsResponse, workspacesResponse, projectsResponse] = await Promise.all([
        this.organizationService.getOrganizations({ page: 1 }).toPromise(),
        this.workspaceService.getWorkspaces({ page: 1 }).toPromise(),
        this.projectService.getProjects({ page: 1 }).toPromise()
      ]);

      // Update raw data
      this.organizations.set(orgsResponse?.results || []);
      this.workspaces.set(workspacesResponse?.results || []);
      this.projects.set(projectsResponse?.results || []);

      // Calculate statistics
      const totalProjects = projectsResponse?.count || 0;
      const activeProjects = projectsResponse?.results?.filter(p => p.status === 'active').length || 0;
      const totalWorkspaces = workspacesResponse?.count || 0;
      const totalOrganizations = orgsResponse?.count || 0;

      // Calculate team members (sum of all workspace member counts)
      const totalMembers = workspacesResponse?.results?.reduce((sum, ws) => sum + ws.member_count, 0) || 0;

      this.quickStats.set([
        {
          label: 'Active Projects',
          value: activeProjects,
          change: 12,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>',
          color: 'blue'
        },
        {
          label: 'Team Members',
          value: totalMembers,
          change: 8,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.121 2.121 0 113 3L19.5 12.75 6.375 19.5"></path>',
          color: 'green'
        },
        {
          label: 'Total Workspaces',
          value: totalWorkspaces,
          change: 5,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>',
          color: 'yellow'
        },
        {
          label: 'Organizations',
          value: totalOrganizations,
          change: 2,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>',
          color: 'purple'
        }
      ]);

    } catch (error: any) {
      console.error('Stats loading failed:', error);
      this.statsError.set('Failed to load statistics');
    } finally {
      this.statsLoading.set(false);
    }
  }

  private async loadRecentProjects(): Promise<void> {
    this.projectsLoading.set(true);
    this.projectsError.set(null);
    
    try {
      const response = await this.projectService.getProjects({ 
        page: 1, 
        ordering: '-created_at' 
      }).toPromise();

      if (response?.results) {
        // Convert API projects to RecentProject format
        const recentProjects: RecentProject[] = response.results.slice(0, 4).map(project => ({
          id: project.id,
          name: project.name,
          description: project.description ?? '',
          status: this.mapProjectStatus(project.status),
          progress: this.calculateProgress(project.status),
          team_size: project.team_member_count ?? 0,
          last_activity: this.formatDate(project.updated_at)
        }));

        this.recentProjects.set(recentProjects);
      }

    } catch (error: any) {
      console.error('Recent projects loading failed:', error);
      this.projectsError.set('Failed to load recent projects');
    } finally {
      this.projectsLoading.set(false);
    }
  }

  private async loadActivityFeed(): Promise<void> {
    this.activityLoading.set(true);
    this.activityError.set(null);
    
    try {
      // For now, generate mock activity based on recent projects
      // In the future, this would come from a real activity API endpoint
      const projects = this.projects();
      const activities: ActivityItem[] = [];

      projects.slice(0, 5).forEach((project, index) => {
        activities.push({
          id: `activity-${index}`,
          user: project.created_by?.full_name ?? 'Unknown',
          action: index % 2 === 0 ? 'updated project' : 'created project',
          target: project.name,
          timestamp: this.formatDate(project.updated_at),
          type: 'project'
        });
      });

      this.activityFeed.set(activities);

    } catch (error: any) {
      console.error('Activity feed loading failed:', error);
      this.activityError.set('Failed to load activity feed');
    } finally {
      this.activityLoading.set(false);
    }
  }

  private mapProjectStatus(status: string): RecentProject['status'] {
    switch (status) {
      case 'active':
        return 'active';
      case 'on_hold':
        return 'on-hold';
      case 'completed':
        return 'completed';
      default:
        return 'active';
    }
  }

  private calculateProgress(status: string): number {
    switch (status) {
      case 'planning':
        return 10;
      case 'active':
        return 45;
      case 'on_hold':
        return 25;
      case 'completed':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 20;
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Getter for template access
  get currentUser() {
    return this.authStore.currentUser;
  }
  
  async refreshData(): Promise<void> {
    await this.loadDashboardData();
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(current => !current);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  getStatColorClasses(color: QuickStat['color']): string {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colorClasses[color];
  }

  getProjectStatusClass(status: RecentProject['status']): string {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return statusClasses[status];
  }

  getActivityTypeColor(type: ActivityItem['type']): string {
    const typeColors = {
      project: 'bg-blue-500',
      task: 'bg-green-500',
      comment: 'bg-yellow-500',
      member: 'bg-purple-500'
    };
    return typeColors[type];
  }

  getActivityIcon(type: ActivityItem['type']): string {
    const typeIcons = {
      project: '<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"></path>',
      task: '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>',
      comment: '<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>',
      member: '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>'
    };
    return typeIcons[type];
  }

  async logout(): Promise<void> {
    await this.authStore.logout();
  }
}
