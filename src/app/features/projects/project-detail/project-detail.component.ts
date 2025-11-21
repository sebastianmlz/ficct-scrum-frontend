import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink, RouterOutlet}
  from '@angular/router';
import {ProjectService} from '../../../core/services/project.service';
import {Project, ProjectConfig, Sprint} from '../../../core/models/interfaces';
import {SprintCreateComponent}
  from '../project-sprints/sprint-create/sprint-create.component';
import {SprintListComponent}
  from '../project-sprints/sprint-list/sprint-list.component';
import {AiService, ProjectReportResponse}
  from '../../../core/services/ai.service';
import {ProjectMembersModalComponent}
  from '../components/project-members-modal/project-members-modal.component';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  subTabs?: {id: string; label: string; route: string; icon?: string}[];
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    SprintCreateComponent,
    SprintListComponent,
    ProjectMembersModalComponent,
  ],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private aiService = inject(AiService);

  project = signal<Project | null>(null);
  sprint = signal<Sprint | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  projectConfig = signal<ProjectConfig | null>(null);
  openModal = signal(false);

  // AI Project Report
  aiReportLoading = signal(false);
  aiReportError = signal<string | null>(null);
  aiReport = signal<ProjectReportResponse | null>(null);
  showAiReport = signal(false);

  // Tab navigation
  activeTab = signal<string>('overview');
  codeDropdownOpen = signal<boolean>(false);
  diagramsDropdownOpen = signal<boolean>(false);

  // Team members modal
  showTeamModal = signal(false);
  memberCount = signal(0);

  tabs: Tab[] = [
    {id: 'overview', label: 'Overview', icon: 'home'},
    {id: 'dashboard', label: 'Dashboard', icon: 'dashboard',
      route: 'dashboard'},
    {id: 'board', label: 'Board', icon: 'view_column', route: 'boards'},
    {id: 'issues', label: 'Issues', icon: 'list', route: 'issues'},
    {id: 'activity', label: 'Activity', icon: 'history', route: 'activity'},
    {id: 'sprints', label: 'Sprints', icon: 'schedule'},
    {
      id: 'code',
      label: 'Code',
      icon: 'code',
      subTabs: [
        {id: 'commits', label: 'Commits', route: 'commits', icon: 'commit'},
        {id: 'prs', label: 'Pull Requests', route: 'pull-requests',
          icon: 'git_pull_request'},
        {id: 'metrics', label: 'Code Metrics', route: 'metrics',
          icon: 'bar_chart'},
        {id: 'github', label: 'GitHub Settings', route: 'github',
          icon: 'settings'},
      ],
    },
    {
      id: 'diagrams',
      label: 'Diagrams',
      icon: 'account_tree',
      subTabs: [
        {id: 'workflow', label: 'Workflow', route: 'diagrams/workflow',
          icon: 'workflow'},
        {id: 'dependencies', label: 'Dependencies',
          route: 'diagrams/dependencies', icon: 'link'},
        {id: 'roadmap', label: 'Roadmap', route: 'diagrams/roadmap',
          icon: 'calendar'},
        {id: 'uml', label: 'UML', route: 'diagrams/uml', icon: 'diagram'},
        {id: 'architecture', label: 'Architecture',
          route: 'diagrams/architecture', icon: 'architecture'},
      ],
    },
    {id: 'settings', label: 'Settings', icon: 'settings', route: 'config'},
  ];


  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProject(id);
      }
    });

    // Detect child route navigation to update active tab
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('/commits') || url.includes('/pull-requests') ||
          url.includes('/metrics') || url.includes('/github')) {
        this.activeTab.set('code');
      } else if (url.includes('/diagrams/')) {
        this.activeTab.set('diagrams');
      } else if (url.includes('/dashboard')) {
        this.activeTab.set('dashboard');
      } else if (url.includes('/issues')) {
        this.activeTab.set('issues');
      } else if (url.includes('/activity')) {
        this.activeTab.set('activity');
      } else if (url.includes('/boards')) {
        this.activeTab.set('board');
      } else if (url.match(/\/projects\/[^/]+$/)) {
        this.activeTab.set('overview');
      }
    });
  }

  async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const project = await this.projectService.getProject(id).toPromise();
      console.log('[PROJECT-DETAIL] 📦 Project loaded from API:', project);
      console.log('[PROJECT-DETAIL] 📦 Workspace in project:',
          project?.workspace);
      console.log('[PROJECT-DETAIL] 📦 Workspace ID:', project?.workspace?.id);

      if (project) {
        this.project.set(project);
        await this.loadConfigProject(id);
        await this.loadMemberCount(id);
      }
    } catch (error: any) {
      console.error('[PROJECT-DETAIL] ❌ Error loading project:', error);
      this.error.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMemberCount(projectId: string): Promise<void> {
    try {
      const response = await this.projectService
          .getProjectMembers(projectId, {page: 1}).toPromise();
      if (response) {
        this.memberCount.set(response.count || 0);
        console.log('[PROJECT-DETAIL] Member count:', response.count);
      }
    } catch (error: any) {
      console.error('[PROJECT-DETAIL] Error loading member count:', error);
      // Non-critical error, don't show to user
    }
  }

  /**
   * Get workspace ID from project
   */
  getWorkspaceId(): string | null {
    const workspace = this.project()?.workspace;
    if (!workspace) return null;

    // Handle workspace as string UUID (actual API response)
    if (typeof workspace === 'string') {
      return workspace;
    }

    // Handle workspace as Workspace object (TypeScript interface)
    if (typeof workspace === 'object' && 'id' in workspace) {
      return workspace.id;
    }

    return null;
  }

  openTeamModal(): void {
    console.log('[PROJECT-DETAIL] Opening team modal');
    console.log('[PROJECT-DETAIL] Project:', this.project());
    console.log('[PROJECT-DETAIL] Project ID:', this.project()?.id);
    console.log('[PROJECT-DETAIL] Workspace:', this.project()?.workspace);

    if (!this.project()?.id) {
      console.error('[PROJECT-DETAIL] ❌ Cannot open modal: Project ID missing');
      return;
    }

    const workspaceId = this.getWorkspaceId();
    if (!workspaceId) {
      console.error(
          '[PROJECT-DETAIL] ❌ Cannot open modal: Workspace ID missing');
      console.error(
          '[PROJECT-DETAIL] Workspace value:', this.project()?.workspace);
      return;
    }

    console.log(
        '[PROJECT-DETAIL] ✅ Opening modal with workspace ID:', workspaceId);
    this.showTeamModal.set(true);
  }

  closeTeamModal(): void {
    console.log('[PROJECT-DETAIL] Closing team modal');
    this.showTeamModal.set(false);
    // Refresh member count after modal closes
    if (this.project()?.id) {
      this.loadMemberCount(this.project()!.id);
    }
  }

  async loadConfigProject(id: string): Promise<void> {
    /* En caso que tengan configuraciones iniciales*/
    this.loading.set(true);
    this.error.set(null);
    try {
      const config = await this.projectService.getProjectConfig(id).toPromise();
      if (config) {
        this.projectConfig.set(config);
      }
    } catch (error: any) {
      if (error.status === 404) {
        this.projectConfig.set(null);
      } else {
        this.error.set(error.error?.message ||
          'Failed to load project configuration');
      }
    } finally {
      this.loading.set(false);
    }
  }


  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  showSprintModal(): void {
    this.openModal.set(true);
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatLabel(text: string): string {
    if (!text) return '';
    return text
        .split('_')
        .map((word) => word.charAt(0)
            .toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  setActiveTab(tabId: string): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    this.activeTab.set(tabId);
    this.codeDropdownOpen.set(false);
    this.diagramsDropdownOpen.set(false);

    // Navigate if tab has a route
    if (tab.route && this.project()) {
      this.router.navigate(['/projects', this.project()!.id, tab.route]);
    }
  }

  navigateToSubTab(route: string): void {
    if (this.project()) {
      console.log('[NAV] Navigating to sub-tab:', route);
      console.log('[NAV] Current route:', this.route);
      // Navigate to child route relative to current route
      this.router.navigate([route], {relativeTo: this.route});
      this.codeDropdownOpen.set(false);
      this.diagramsDropdownOpen.set(false);
    }
  }

  toggleCodeDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.codeDropdownOpen.update((open) => !open);
    this.diagramsDropdownOpen.set(false);
  }

  toggleDiagramsDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.diagramsDropdownOpen.update((open) => !open);
    this.codeDropdownOpen.set(false);
  }

  closeAllDropdowns(): void {
    this.codeDropdownOpen.set(false);
    this.diagramsDropdownOpen.set(false);
  }

  // AI Project Report Methods
  async generateAiReport(forceRefresh = false): Promise<void> {
    if (!this.project()) {
      this.aiReportError.set('Project not loaded');
      return;
    }

    this.aiReportLoading.set(true);
    this.aiReportError.set(null);
    this.showAiReport.set(true);

    if (forceRefresh) {
      console.log('[PROJECT-DETAIL] 🔄 Force refreshing AI report');
    } else {
      console.log('[PROJECT-DETAIL] 🤖 Requesting AI report for project:',
        this.project()!.id);
    }

    try {
      const response = await this.aiService.generateProjectReport({
        project_id: this.project()!.id,
        include_sprints: true,
        include_issues: true,
      }, forceRefresh).toPromise();

      console.log('[PROJECT-DETAIL] ✅ AI report received:', response);

      if (response) {
        this.aiReport.set(response);

        // Warn if all metrics are zero (no data available)
        if (response.completion === 0 && response.velocity === 0 &&
          response.risk_score === 0) {
          console.warn('[PROJECT-DETAIL] ⚠️ All metrics are zero - ' +
            'project may have no completed work');
          this.aiReportError.set('No metrics available. Ensure project has ' +
            'completed issues and active sprints.');
        }
      }
    } catch (err: any) {
      console.error('[PROJECT-DETAIL] ❌ AI report generation failed:', {
        status: err.status,
        statusText: err.statusText,
        message: err.message,
        error: err.error,
      });

      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to generate AI report. Please try again.';

      if (err.status === 401 || err.status === 403) {
        errorMessage = 'You do not have permission to generate reports ' +
        'for this project.';
      } else if (err.status === 404) {
        errorMessage = 'Project not found or ML service unavailable.';
      } else if (err.status === 408 || err.name === 'TimeoutError') {
        errorMessage = 'Report generation timed out. The ML model ' +
        'may be busy. Please try again in a moment.';
      } else if (err.status === 500) {
        errorMessage = err.error?.error || err.error?.detail ||
        'Server error while generating report. Please try again later.';
      } else if (err.status === 0) {
        errorMessage = 'Network error. Please check your connection ' +
        'and try again.';
      } else if (err.error?.error) {
        errorMessage = err.error.error;
      } else if (err.error?.detail) {
        errorMessage = err.error.detail;
      }

      this.aiReportError.set(errorMessage);
    } finally {
      this.aiReportLoading.set(false);
    }
  }

  toggleAiReport(): void {
    this.showAiReport.update((v) => !v);
    if (this.showAiReport() && !this.aiReport()) {
      this.generateAiReport();
    }
  }

  refreshAiReport(): void {
    this.generateAiReport(true); // Force refresh bypasses cache
  }

  /**
   * Check if cached data is fresh (< 5 minutes old)
   */
  isCacheFresh(): boolean {
    const report = this.aiReport();
    if (!report || !report.generated_at) {
      return false;
    }

    const generatedAt = new Date(report.generated_at).getTime();
    const now = Date.now();
    const ageMinutes = (now - generatedAt) / 1000 / 60;

    return ageMinutes < 5;
  }

  /**
   * Get human-readable cache age
   */
  getCacheAge(): string {
    const report = this.aiReport();
    if (!report || !report.generated_at) {
      return 'Unknown';
    }

    const generatedAt = new Date(report.generated_at).getTime();
    const now = Date.now();
    const ageMinutes = Math.floor((now - generatedAt) / 1000 / 60);

    if (ageMinutes < 1) {
      return 'Just now';
    } else if (ageMinutes === 1) {
      return '1 min ago';
    } else if (ageMinutes < 60) {
      return `${ageMinutes} mins ago`;
    } else {
      const ageHours = Math.floor(ageMinutes / 60);
      return ageHours === 1 ? '1 hour ago' : `${ageHours} hours ago`;
    }
  }
}
