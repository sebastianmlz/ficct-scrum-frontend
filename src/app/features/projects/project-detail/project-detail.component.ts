import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectConfig, Sprint } from '../../../core/models/interfaces';
import { ProjectStatusEnum, ProjectPriorityEnum } from '../../../core/models/enums';
import { SprintCreateComponent } from '../project-sprints/sprint-create/sprint-create.component';
import { SprintListComponent } from '../project-sprints/sprint-list/sprint-list.component';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  subTabs?: Array<{id: string; label: string; route: string; icon?: string}>;
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
  ],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  project = signal<Project | null>(null);
  sprint = signal<Sprint | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  projectConfig = signal<ProjectConfig | null>(null);
  openModal = signal(false);

  // Tab navigation
  activeTab = signal<string>('overview');
  codeDropdownOpen = signal<boolean>(false);
  diagramsDropdownOpen = signal<boolean>(false);

  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'board', label: 'Board', icon: 'view_column', route: 'boards' },
    { id: 'sprints', label: 'Sprints', icon: 'schedule' },
    { 
      id: 'code', 
      label: 'Code',
      icon: 'code',
      subTabs: [
        { id: 'commits', label: 'Commits', route: 'commits', icon: 'commit' },
        { id: 'prs', label: 'Pull Requests', route: 'pull-requests', icon: 'git_pull_request' },
        { id: 'metrics', label: 'Code Metrics', route: 'metrics', icon: 'bar_chart' },
        { id: 'github', label: 'GitHub Settings', route: 'github', icon: 'settings' }
      ]
    },
    { 
      id: 'diagrams', 
      label: 'Diagrams',
      icon: 'account_tree',
      subTabs: [
        { id: 'workflow', label: 'Workflow', route: 'diagrams/workflow', icon: 'workflow' },
        { id: 'dependencies', label: 'Dependencies', route: 'diagrams/dependencies', icon: 'link' },
        { id: 'roadmap', label: 'Roadmap', route: 'diagrams/roadmap', icon: 'calendar' },
        { id: 'uml', label: 'UML', route: 'diagrams/uml', icon: 'diagram' },
        { id: 'architecture', label: 'Architecture', route: 'diagrams/architecture', icon: 'architecture' }
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings', route: 'config' }
  ];


  ngOnInit(): void {
    this.route.params.subscribe(params => {
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
      if (project) {
        this.project.set(project);
        await this.loadConfigProject(id);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  async loadConfigProject(id: string): Promise<void> {
    /*En caso que tengan configuraciones iniciales*/
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
        this.error.set(error.error?.message || 'Failed to load project configuration');
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
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  setActiveTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
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
      this.router.navigate([route], { relativeTo: this.route });
      this.codeDropdownOpen.set(false);
      this.diagramsDropdownOpen.set(false);
    }
  }

  toggleCodeDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.codeDropdownOpen.update(open => !open);
    this.diagramsDropdownOpen.set(false);
  }

  toggleDiagramsDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.diagramsDropdownOpen.update(open => !open);
    this.codeDropdownOpen.set(false);
  }

  closeAllDropdowns(): void {
    this.codeDropdownOpen.set(false);
    this.diagramsDropdownOpen.set(false);
  }
}
