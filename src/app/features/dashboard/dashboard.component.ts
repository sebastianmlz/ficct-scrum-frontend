import {AuthService} from './../../core/services/auth.service';
import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {AuthStore} from '../../core/store/auth.store';
import {OrganizationService} from '../../core/services/organization.service';
import {Router} from '@angular/router';

import {WorkspaceService} from '../../core/services/workspace.service';
import {ProjectService} from '../../core/services/project.service';
import {ActivityLogService} from '../../core/services/activity-log.service';
import {Organization, Workspace, Project} from '../../core/models/interfaces';

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
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  public authStore = inject(AuthStore);
  private organizationService = inject(OrganizationService);
  private workspaceService = inject(WorkspaceService);
  private projectService = inject(ProjectService);
  private activityLogService = inject(ActivityLogService);
  private authService = inject(AuthService);
  private router = inject(Router);

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
        this.loadActivityFeed(),
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
      const [orgsResponse, workspacesResponse, projectsResponse] =
      await Promise.all([
        this.organizationService.getOrganizations({page: 1}).toPromise(),
        this.workspaceService.getWorkspaces(undefined, 1).toPromise(),
        this.projectService.getProjects({page: 1}).toPromise(),
      ]);

      // Update raw data
      this.organizations.set(orgsResponse?.results || []);
      // Cast workspaces to avoid type mismatch
      this.workspaces.set((workspacesResponse?.results as any) || []);
      this.projects.set(projectsResponse?.results || []);

      // Calculate statistics
      const activeProjects = projectsResponse?.results?.filter((p) =>
        p.status === 'active').length || 0;
      const totalWorkspaces = workspacesResponse?.count || 0;
      const totalOrganizations = orgsResponse?.count || 0;

      // Calculate team members - use organization members API for accurate coun
      let totalMembers = 0;

      // Get first organization's members if available
      if (orgsResponse?.results && orgsResponse.results.length > 0) {
        const firstOrg = orgsResponse.results[0];
        try {
          const membersResponse =
          await this.organizationService.getOrganizationMembers(
              firstOrg.id,
              {page: 1},
          ).toPromise();
          totalMembers = membersResponse?.count || 0;
          console.log('[DASHBOARD] 👥 Team members from org API:', totalMembers);
        } catch (error) {
          console.log(error);
          console.warn('[DASHBOARD] ⚠️ Could not load organization members' +
            ', defaulting to 0');
          totalMembers = 0;
        }
      }

      this.quickStats.set([
        {
          label: 'Active Projects',
          value: activeProjects,
          change: 12,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" ' +
          'stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 ' +
          '2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0' +
          ' 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>',
          color: 'blue',
        },
        {
          label: 'Team Members',
          value: totalMembers,
          change: 8,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" ' +
          'stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 ' +
          '0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.121 2.121 0 113' +
          ' 3L19.5 12.75 6.375 19.5"></path>',
          color: 'green',
        },
        {
          label: 'Total Workspaces',
          value: totalWorkspaces,
          change: 5,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round"' +
          ' stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2' +
          ' 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2' +
          ' 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>',
          color: 'yellow',
        },
        {
          label: 'Organizations',
          value: totalOrganizations,
          change: 2,
          changeType: 'increase',
          icon: '<path stroke-linecap="round" stroke-linejoin="round"' +
          ' stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 ' +
          '20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 ' +
          '015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 ' +
          '5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4' +
          ' 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>',
          color: 'purple',
        },
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
        ordering: '-created_at',
      }).toPromise();

      if (response?.results) {
        // Convert API projects to RecentProject format
        const recentProjects: RecentProject[] =
        response.results.slice(0, 4).map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description ?? '',
          status: this.mapProjectStatus(project.status),
          progress: this.calculateProgress(project.status),
          team_size: project.team_member_count ?? 0,
          last_activity: this.formatDate(project.updated_at),
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
      // Fetch real activity logs from API
      const response = await this.activityLogService.getActivityLogs({
        page: 1,
        page_size: 5, // DRF standard pagination parameter
        ordering: '-created_at',
      }).toPromise();

      if (response?.results) {
        // Convert API activity logs to ActivityItem format
        const activities: ActivityItem[] = response.results.map((log) => ({
          id: log.id,
          user: log.user_detail?.full_name || log.user_name ||
          `User ${log.user}`,
          action: log.formatted_action || log.action_display,
          target: log.object_repr || log.object_type,
          timestamp: log.time_ago || this.formatDate(log.created_at),
          type: this.mapObjectTypeToActivityType(log.object_type),
        }));

        this.activityFeed.set(activities);
      } else {
        this.activityFeed.set([]);
      }
    } catch (error: any) {
      console.error('Activity feed loading failed:', error);
      this.activityError.set('Failed to load activity feed');
      // Set empty array on error so UI shows "No recent activity"
      this.activityFeed.set([]);
    } finally {
      this.activityLoading.set(false);
    }
  }

  private mapObjectTypeToActivityType(objectType: string):
  ActivityItem['type'] {
    switch (objectType) {
      case 'project':
        return 'project';
      case 'issue':
      case 'sprint':
        return 'task';
      case 'comment':
        return 'comment';
      case 'member':
      case 'user':
        return 'member';
      default:
        return 'project';
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
    this.showUserMenu.update((current) => !current);
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
      purple: 'bg-purple-100 text-purple-600',
    };
    return colorClasses[color];
  }

  getProjectStatusClass(status: RecentProject['status']): string {
    const statusClasses = {
      'active': 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
    };
    return statusClasses[status];
  }

  getActivityTypeColor(type: ActivityItem['type']): string {
    const typeColors = {
      project: 'bg-blue-500',
      task: 'bg-green-500',
      comment: 'bg-yellow-500',
      member: 'bg-purple-500',
    };
    return typeColors[type];
  }

  getActivityIcon(type: ActivityItem['type']): string {
    const typeIcons = {
      project: '<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0' +
      ' 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0' +
      ' 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1' +
      ' 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"></path>',
      task: '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8' +
      ' 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1' +
      ' 1 0 011.414 0z" clip-rule="evenodd"></path>',
      comment: '<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841' +
      ' 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 ' +
      '10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 ' +
      '9h2v2H9V9z" clip-rule="evenodd"></path>',
      member: '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0' +
      ' 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>',
    };
    return typeIcons[type];
  }

  async logout(): Promise<void> {
    try {
      // Try to logout through AuthStore first (which handles API call)
      await this.authStore.logout();
    } catch (error) {
      console.error('AuthStore logout failed, falling back to AuthService:',
          error);
      // Fallback to AuthService logout
      this.authService.logout();
    }

    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  // Navigation methods
  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToActiveProjects(): void {
    this.router.navigate(['/projects'], {queryParams: {status: 'active'}});
  }

  navigateToTeamMembers(): void {
    // TODO: Navigate to team members page when implemented
    console.log('Navigate to team members');
  }

  navigateToWorkspaces(): void {
    // TODO: Navigate to workspaces page when implemented
    console.log('Navigate to workspaces');
  }

  navigateToOrganizations(): void {
    this.router.navigate(['/organizations']);
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  navigateToActivity(activity: ActivityItem): void {
    // Use the actual object_url from the activity log
    const activityLog = this.activityFeed().find((a) => a.id === activity.id);
    if (activityLog) {
      // Navigate to the object URL if available
      console.log('Navigate to activity:', activity);
      // TODO: Parse and navigate to object_url
    }
  }
}
