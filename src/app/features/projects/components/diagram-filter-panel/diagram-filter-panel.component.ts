import {Component, EventEmitter, inject, Input, OnInit, Output, signal}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SprintsService} from '../../../../core/services/sprints.service';
import {ProjectService} from '../../../../core/services/project.service';
import {IssueService} from '../../../../core/services/issue.service';
import {IssueType, ProjectMember, Sprint}
  from '../../../../core/models/interfaces';

interface WorkflowStatus {
  id: string;
  name: string;
}

export interface DiagramFilters {
  sprint_id?: string | null;
  status_ids?: string[];
  priorities?: string[];
  assignee_id?: string | null;
  issue_type_ids?: string[];
  search?: string | null;
}

@Component({
  selector: 'app-diagram-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagram-filter-panel.component.html',
  styles: [],
})
export class DiagramFilterPanelComponent implements OnInit {
  private sprintsService = inject(SprintsService);
  private projectService = inject(ProjectService);
  private issueService = inject(IssueService);

  @Input() projectId!: string;
  @Output() filtersChanged = new EventEmitter<DiagramFilters>();

  // Data sources
  sprints = signal<Sprint[]>([]);
  statuses = signal<WorkflowStatus[]>([]);
  issueTypes = signal<IssueType[]>([]);
  members = signal<ProjectMember[]>([]);

  // Filter values
  selectedSprint: string | null = null;
  selectedAssignee: string | null = null;
  searchText = '';
  selectedPriorities = signal<string[]>(['P1', 'P2', 'P3', 'P4']);
  selectedStatuses = signal<string[]>([]);
  selectedIssueTypes = signal<string[]>([]);

  priorities = [
    {value: 'P1', label: 'P1 Critical'},
    {value: 'P2', label: 'P2 High'},
    {value: 'P3', label: 'P3 Medium'},
    {value: 'P4', label: 'P4 Low'},
  ];

  private searchTimeout: any;

  ngOnInit(): void {
    console.log('[DIAGRAM-FILTER] Initializing for project:', this.projectId);
    this.loadFilterData();
  }

  async loadFilterData(): Promise<void> {
    try {
      // Load sprints
      const sprintsResponse =await this.sprintsService
          .getSprints(this.projectId, {page: 1}).toPromise();
      if (sprintsResponse) {
        this.sprints.set(sprintsResponse.results || []);
        console.log('[DIAGRAM-FILTER] Loaded sprints:',
            sprintsResponse.results?.length);
      }

      // Load statuses - mock data for now
      const mockStatuses: WorkflowStatus[] = [
        {id: 'backlog', name: 'Backlog'},
        {id: 'todo', name: 'To Do'},
        {id: 'in_progress', name: 'In Progress'},
        {id: 'done', name: 'Done'},
      ];
      this.statuses.set(mockStatuses);
      this.selectedStatuses.set(mockStatuses.map((s: WorkflowStatus) => s.id));
      console.log('[DIAGRAM-FILTER] Loaded statuses:', mockStatuses.length);

      // Load issue types
      const typesResponse =
        await this.issueService.getIssueTypes(this.projectId).toPromise();
      if (typesResponse) {
        this.issueTypes.set(typesResponse.results || []);
        // Select all types by default
        this.selectedIssueTypes.set((typesResponse.results || [])
            .map((t) => t.id));
        console.log('[DIAGRAM-FILTER] Loaded issue types:',
            typesResponse.results?.length);
      }

      // Load project members
      const membersResponse = await this.projectService.
          getProjectMembers(this.projectId, {page: 1}).toPromise();
      if (membersResponse) {
        this.members.set(membersResponse.results || []);
        console.log('[DIAGRAM-FILTER] Loaded members:',
            membersResponse.results?.length);
      }
    } catch (error) {
      console.error('[DIAGRAM-FILTER] Error loading filter data:', error);
    }
  }

  onFilterChange(): void {
    this.emitFilters();
  }

  onSearchChange(): void {
    // Debounce search input
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.emitFilters();
    }, 300);
  }

  togglePriority(priority: string): void {
    this.selectedPriorities.update((priorities) => {
      if (priorities.includes(priority)) {
        return priorities.filter((p) => p !== priority);
      } else {
        return [...priorities, priority];
      }
    });
    this.onFilterChange();
  }

  toggleStatus(statusId: string): void {
    this.selectedStatuses.update((statuses) => {
      if (statuses.includes(statusId)) {
        return statuses.filter((s) => s !== statusId);
      } else {
        return [...statuses, statusId];
      }
    });
    this.onFilterChange();
  }

  toggleIssueType(typeId: string): void {
    this.selectedIssueTypes.update((types) => {
      if (types.includes(typeId)) {
        return types.filter((t) => t !== typeId);
      } else {
        return [...types, typeId];
      }
    });
    this.onFilterChange();
  }

  clearSprint(): void {
    this.selectedSprint = null;
    this.onFilterChange();
  }

  clearAssignee(): void {
    this.selectedAssignee = null;
    this.onFilterChange();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.selectedSprint = null;
    this.selectedAssignee = null;
    this.searchText = '';
    // Reset to all selected
    this.selectedPriorities.set(['P1', 'P2', 'P3', 'P4']);
    this.selectedStatuses.set(this.statuses().map((s) => s.id));
    this.selectedIssueTypes.set(this.issueTypes().map((t) => t.id));
    this.onFilterChange();
  }

  emitFilters(): void {
    const filters: DiagramFilters = {};

    if (this.selectedSprint) {
      filters.sprint_id = this.selectedSprint;
    }

    if (this.selectedAssignee) {
      filters.assignee_id = this.selectedAssignee;
    }

    if (this.searchText && this.searchText.trim()) {
      filters.search = this.searchText.trim();
    }

    // CRITICAL FIX: Always send selected filters to backend
    // Backend needs explicit filter values, not implicit "all"

    // Always include priorities if any selected
    if (this.selectedPriorities().length > 0) {
      filters.priorities = this.selectedPriorities();
    }

    // Always include status_ids if any selected
    if (this.selectedStatuses().length > 0) {
      filters.status_ids = this.selectedStatuses();
    }

    // Always include issue_type_ids if any selected
    if (this.selectedIssueTypes().length > 0) {
      filters.issue_type_ids = this.selectedIssueTypes();
    }

    console.log('[DIAGRAM-FILTER] 📤 Emitting filters:', filters);
    console.log('[DIAGRAM-FILTER] 🔢 Filter parameter count:',
        Object.keys(filters).length);
    console.log('[DIAGRAM-FILTER] 📋 Priorities:', filters.priorities || 'none');
    console.log('[DIAGRAM-FILTER] 📋 Status IDs:', filters.status_ids || 'none');
    console.log('[DIAGRAM-FILTER] 📋 Issue Type IDs:',
        filters.issue_type_ids || 'none');

    this.filtersChanged.emit(filters);
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.selectedSprint) count++;
    if (this.selectedAssignee) count++;
    if (this.searchText && this.searchText.trim()) count++;
    if (this.selectedPriorities().length < 4) count++;
    const allStatuses = this.statuses().map((s) => s.id);
    if (this.selectedStatuses().length < allStatuses.length) count++;
    const allTypes = this.issueTypes().map((t) => t.id);
    if (this.selectedIssueTypes().length < allTypes.length) count++;
    return count;
  }

  getSprintName(sprintId: string): string {
    if (sprintId === 'backlog') return 'Backlog';
    const sprint = this.sprints().find((s) => s.id === sprintId);
    return sprint?.name || sprintId;
  }

  getAssigneeName(assigneeId: string): string {
    if (assigneeId === 'unassigned') return 'Unassigned';
    const member = this.members().find((m) => m.user.user_uuid === assigneeId);
    return member?.user.full_name || assigneeId;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'P1': 'inline-flex items-center px-2 py-0.5 rounded text-xs ' +
      'font-medium bg-red-100 text-red-800',
      'P2': 'inline-flex items-center px-2 py-0.5 rounded text-xs ' +
      'font-medium bg-orange-100 text-orange-800',
      'P3': 'inline-flex items-center px-2 py-0.5 rounded text-xs ' +
      'font-medium bg-yellow-100 text-yellow-800',
      'P4': 'inline-flex items-center px-2 py-0.5 rounded text-xs ' +
      'font-medium bg-gray-100 text-gray-800',
    };
    return classes[priority] || classes['P3'];
  }
}
