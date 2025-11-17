import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintsService } from '../../../../core/services/sprints.service';
import { ProjectService } from '../../../../core/services/project.service';
import { IssueService } from '../../../../core/services/issue.service';
import { IssueType, ProjectMember, Sprint } from '../../../../core/models/interfaces';

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
  template: `
    <div class="bg-white border-b border-gray-200 p-4 space-y-4">
      <!-- Filters Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          Filters
          @if (activeFilterCount() > 0) {
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ activeFilterCount() }}
            </span>
          }
        </h3>
        @if (activeFilterCount() > 0) {
          <button
            type="button"
            (click)="clearAllFilters()"
            class="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Clear All
          </button>
        }
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Sprint Filter -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-700">Sprint</label>
          <select
            [(ngModel)]="selectedSprint"
            (ngModelChange)="onFilterChange()"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            <option [ngValue]="null">All Sprints</option>
            <option value="backlog">Backlog</option>
            @for (sprint of sprints(); track sprint.id) {
              <option [ngValue]="sprint.id">{{ sprint.name }}</option>
            }
          </select>
        </div>

        <!-- Assignee Filter -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-700">Assignee</label>
          <select
            [(ngModel)]="selectedAssignee"
            (ngModelChange)="onFilterChange()"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            <option [ngValue]="null">All Members</option>
            <option value="unassigned">Unassigned</option>
            @for (member of members(); track member.id) {
              <option [ngValue]="member.user.user_uuid">{{ member.user.full_name }}</option>
            }
          </select>
        </div>

        <!-- Search Filter -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-700">Search</label>
          <input
            type="text"
            [(ngModel)]="searchText"
            (ngModelChange)="onSearchChange()"
            placeholder="Search by title or key..."
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
        </div>
      </div>

      <!-- Priority Filter (Checkboxes) -->
      <div class="space-y-2">
        <label class="block text-xs font-medium text-gray-700">Priority</label>
        <div class="flex flex-wrap gap-3">
          @for (priority of priorities; track priority.value) {
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                [checked]="selectedPriorities().includes(priority.value)"
                (change)="togglePriority(priority.value)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
              <span class="ml-2 text-sm text-gray-700">
                <span [class]="getPriorityBadgeClass(priority.value)">
                  {{ priority.label }}
                </span>
              </span>
            </label>
          }
        </div>
      </div>

      <!-- Status Filter (Checkboxes) -->
      <div class="space-y-2">
        <label class="block text-xs font-medium text-gray-700">Status</label>
        <div class="flex flex-wrap gap-3">
          @for (status of statuses(); track status.id) {
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                [checked]="selectedStatuses().includes(status.id)"
                (change)="toggleStatus(status.id)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
              <span class="ml-2 text-sm text-gray-700">{{ status.name }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Issue Type Filter (Checkboxes) -->
      <div class="space-y-2">
        <label class="block text-xs font-medium text-gray-700">Issue Type</label>
        <div class="flex flex-wrap gap-3">
          @for (type of issueTypes(); track type.id) {
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                [checked]="selectedIssueTypes().includes(type.id)"
                (change)="toggleIssueType(type.id)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
              <span class="ml-2 text-sm text-gray-700">{{ type.name }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Active Filters Chips -->
      @if (activeFilterCount() > 0) {
        <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          @if (selectedSprint) {
            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Sprint: {{ getSprintName(selectedSprint) }}
              <button type="button" (click)="clearSprint()" class="ml-1 hover:text-blue-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>
          }
          @if (selectedAssignee) {
            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Assignee: {{ getAssigneeName(selectedAssignee) }}
              <button type="button" (click)="clearAssignee()" class="ml-1 hover:text-blue-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>
          }
          @if (searchText) {
            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Search: "{{ searchText }}"
              <button type="button" (click)="clearSearch()" class="ml-1 hover:text-blue-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>
          }
        </div>
      }
    </div>
  `,
  styles: []
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
    { value: 'P1', label: 'P1 Critical' },
    { value: 'P2', label: 'P2 High' },
    { value: 'P3', label: 'P3 Medium' },
    { value: 'P4', label: 'P4 Low' }
  ];

  private searchTimeout: any;

  ngOnInit(): void {
    console.log('[DIAGRAM-FILTER] Initializing for project:', this.projectId);
    this.loadFilterData();
  }

  async loadFilterData(): Promise<void> {
    try {
      // Load sprints
      const sprintsResponse = await this.sprintsService.getSprints(this.projectId, { page: 1 }).toPromise();
      if (sprintsResponse) {
        this.sprints.set(sprintsResponse.results || []);
        console.log('[DIAGRAM-FILTER] Loaded sprints:', sprintsResponse.results?.length);
      }

      // Load statuses - mock data for now (backend doesn't have dedicated endpoint)
      const mockStatuses: WorkflowStatus[] = [
        { id: 'backlog', name: 'Backlog' },
        { id: 'todo', name: 'To Do' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'done', name: 'Done' }
      ];
      this.statuses.set(mockStatuses);
      this.selectedStatuses.set(mockStatuses.map((s: WorkflowStatus) => s.id));
      console.log('[DIAGRAM-FILTER] Loaded statuses:', mockStatuses.length);

      // Load issue types
      const typesResponse = await this.issueService.getIssueTypes(this.projectId).toPromise();
      if (typesResponse) {
        this.issueTypes.set(typesResponse.results || []);
        // Select all types by default
        this.selectedIssueTypes.set((typesResponse.results || []).map(t => t.id));
        console.log('[DIAGRAM-FILTER] Loaded issue types:', typesResponse.results?.length);
      }

      // Load project members
      const membersResponse = await this.projectService.getProjectMembers(this.projectId, { page: 1 }).toPromise();
      if (membersResponse) {
        this.members.set(membersResponse.results || []);
        console.log('[DIAGRAM-FILTER] Loaded members:', membersResponse.results?.length);
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
    this.selectedPriorities.update(priorities => {
      if (priorities.includes(priority)) {
        return priorities.filter(p => p !== priority);
      } else {
        return [...priorities, priority];
      }
    });
    this.onFilterChange();
  }

  toggleStatus(statusId: string): void {
    this.selectedStatuses.update(statuses => {
      if (statuses.includes(statusId)) {
        return statuses.filter(s => s !== statusId);
      } else {
        return [...statuses, statusId];
      }
    });
    this.onFilterChange();
  }

  toggleIssueType(typeId: string): void {
    this.selectedIssueTypes.update(types => {
      if (types.includes(typeId)) {
        return types.filter(t => t !== typeId);
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
    this.selectedStatuses.set(this.statuses().map(s => s.id));
    this.selectedIssueTypes.set(this.issueTypes().map(t => t.id));
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
    console.log('[DIAGRAM-FILTER] 🔢 Filter parameter count:', Object.keys(filters).length);
    console.log('[DIAGRAM-FILTER] 📋 Priorities:', filters.priorities || 'none');
    console.log('[DIAGRAM-FILTER] 📋 Status IDs:', filters.status_ids || 'none');
    console.log('[DIAGRAM-FILTER] 📋 Issue Type IDs:', filters.issue_type_ids || 'none');
    
    this.filtersChanged.emit(filters);
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.selectedSprint) count++;
    if (this.selectedAssignee) count++;
    if (this.searchText && this.searchText.trim()) count++;
    if (this.selectedPriorities().length < 4) count++;
    const allStatuses = this.statuses().map(s => s.id);
    if (this.selectedStatuses().length < allStatuses.length) count++;
    const allTypes = this.issueTypes().map(t => t.id);
    if (this.selectedIssueTypes().length < allTypes.length) count++;
    return count;
  }

  getSprintName(sprintId: string): string {
    if (sprintId === 'backlog') return 'Backlog';
    const sprint = this.sprints().find(s => s.id === sprintId);
    return sprint?.name || sprintId;
  }

  getAssigneeName(assigneeId: string): string {
    if (assigneeId === 'unassigned') return 'Unassigned';
    const member = this.members().find(m => m.user.user_uuid === assigneeId);
    return member?.user.full_name || assigneeId;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'P1': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800',
      'P2': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800',
      'P3': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800',
      'P4': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800'
    };
    return classes[priority] || classes['P3'];
  }
}
