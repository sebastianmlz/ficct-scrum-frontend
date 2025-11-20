import {Component, Input, Output, EventEmitter, signal, computed, OnInit, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {getAllPriorities, getPriorityLabel, getPriorityBgColor, getPriorityTextColor, PriorityConfig} from '../../../../shared/utils/priority.utils';

export interface BoardFilters {
  search: string;
  priorities: string[];
  assignees: string[];
  issueTypes: string[];
  statuses: string[];
}

export interface FilterOption {
  id: string;
  label: string;
  avatarUrl?: string;
  color?: string;
  bgColor?: string;
  textColor?: string;
}

@Component({
  selector: 'app-board-filter-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-filter-toolbar.component.html',
  styleUrls: ['./board-filter-toolbar.component.scss'],
})
export class BoardFilterToolbarComponent implements OnInit, OnDestroy {
  @Input() availableMembers: any[] = [];
  @Input() availableIssueTypes: any[] = [];
  @Input() availableStatuses: any[] = [];
  @Input() totalIssuesCount = 0;
  @Input() filteredIssuesCount = 0;

  @Output() filtersChanged = new EventEmitter<BoardFilters>();
  @Output() searchChanged = new EventEmitter<string>();

  // State
  filters = signal<BoardFilters>({
    search: '',
    priorities: [],
    assignees: [],
    issueTypes: [],
    statuses: [],
  });

  // Dropdown visibility
  showPriorityDropdown = signal(false);
  showAssigneeDropdown = signal(false);
  showTypeDropdown = signal(false);
  showStatusDropdown = signal(false);

  // Mobile drawer visibility
  showMobileDrawer = signal(false);

  // Search within dropdowns
  assigneeSearch = signal('');
  typeSearch = signal('');

  // Priority data
  priorities = getAllPriorities();

  // Computed
  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!f.search ||
           f.priorities.length > 0 ||
           f.assignees.length > 0 ||
           f.issueTypes.length > 0 ||
           f.statuses.length > 0;
  });

  activeFiltersCount = computed(() => {
    const f = this.filters();
    return f.priorities.length + f.assignees.length + f.issueTypes.length + f.statuses.length;
  });

  // Filtered options
  filteredMembers = computed(() => {
    const search = this.assigneeSearch().toLowerCase();
    if (!search) return this.availableMembers;
    return this.availableMembers.filter((m) =>
      m.user?.full_name?.toLowerCase().includes(search) ||
      m.user?.email?.toLowerCase().includes(search),
    );
  });

  filteredIssueTypes = computed(() => {
    const search = this.typeSearch().toLowerCase();
    if (!search) return this.availableIssueTypes;
    return this.availableIssueTypes.filter((t) =>
      t.name?.toLowerCase().includes(search),
    );
  });

  // Active filter badges for display
  activeFilterBadges = computed(() => {
    const f = this.filters();
    const badges: {type: string, label: string, value: string}[] = [];

    // Priority badges
    f.priorities.forEach((code) => {
      badges.push({
        type: 'priority',
        label: 'Priority',
        value: getPriorityLabel(code),
      });
    });

    // Assignee badges
    f.assignees.forEach((id) => {
      const member = this.availableMembers.find((m) => m.user?.id === id || m.user?.user_uuid === id);
      if (member) {
        badges.push({
          type: 'assignee',
          label: 'Assignee',
          value: member.user?.full_name || 'Unknown',
        });
      }
    });

    // Type badges
    f.issueTypes.forEach((id) => {
      const type = this.availableIssueTypes.find((t) => t.id === id);
      if (type) {
        badges.push({
          type: 'type',
          label: 'Type',
          value: type.name,
        });
      }
    });

    // Status badges
    f.statuses.forEach((id) => {
      const status = this.availableStatuses.find((s) => s.id === id);
      if (status) {
        badges.push({
          type: 'status',
          label: 'Status',
          value: status.name,
        });
      }
    });

    return badges;
  });

  ngOnInit(): void {
    // Close dropdowns on outside click
    document.addEventListener('click', this.closeAllDropdowns.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeAllDropdowns.bind(this));
    // Restore body scroll if drawer was open
    document.body.style.overflow = '';
  }

  // Search
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filters.update((f) => ({...f, search: value}));
    this.searchChanged.emit(value);
    this.emitFilters();
  }

  // Priority filters
  togglePriority(code: string): void {
    this.filters.update((f) => {
      const priorities = f.priorities.includes(code) ?
        f.priorities.filter((p) => p !== code) :
        [...f.priorities, code];
      return {...f, priorities};
    });
    this.emitFilters();
  }

  isPrioritySelected(code: string): boolean {
    return this.filters().priorities.includes(code);
  }

  // Assignee filters
  toggleAssignee(userId: string): void {
    this.filters.update((f) => {
      const assignees = f.assignees.includes(userId) ?
        f.assignees.filter((id) => id !== userId) :
        [...f.assignees, userId];
      return {...f, assignees};
    });
    this.emitFilters();
  }

  isAssigneeSelected(userId: string): boolean {
    return this.filters().assignees.includes(userId);
  }

  // Issue type filters
  toggleIssueType(typeId: string): void {
    this.filters.update((f) => {
      const issueTypes = f.issueTypes.includes(typeId) ?
        f.issueTypes.filter((id) => id !== typeId) :
        [...f.issueTypes, typeId];
      return {...f, issueTypes};
    });
    this.emitFilters();
  }

  isIssueTypeSelected(typeId: string): boolean {
    return this.filters().issueTypes.includes(typeId);
  }

  // Status filters
  toggleStatus(statusId: string): void {
    this.filters.update((f) => {
      const statuses = f.statuses.includes(statusId) ?
        f.statuses.filter((id) => id !== statusId) :
        [...f.statuses, statusId];
      return {...f, statuses};
    });
    this.emitFilters();
  }

  isStatusSelected(statusId: string): boolean {
    return this.filters().statuses.includes(statusId);
  }

  // Clear filters
  clearAllFilters(): void {
    this.filters.set({
      search: '',
      priorities: [],
      assignees: [],
      issueTypes: [],
      statuses: [],
    });
    this.emitFilters();
  }

  clearFilterType(type: string, value?: string): void {
    this.filters.update((f) => {
      switch (type) {
        case 'search':
          return {...f, search: ''};
        case 'priority':
          return {...f, priorities: value ? f.priorities.filter((p) => getPriorityLabel(p) !== value) : []};
        case 'assignee':
          return {...f, assignees: value ? f.assignees.filter((a) => {
            const member = this.availableMembers.find((m) => m.user?.id === a || m.user?.user_uuid === a);
            return member?.user?.full_name !== value;
          }) : []};
        case 'type':
          return {...f, issueTypes: value ? f.issueTypes.filter((t) => {
            const type = this.availableIssueTypes.find((it) => it.id === t);
            return type?.name !== value;
          }) : []};
        case 'status':
          return {...f, statuses: value ? f.statuses.filter((s) => {
            const status = this.availableStatuses.find((st) => st.id === s);
            return status?.name !== value;
          }) : []};
        default:
          return f;
      }
    });
    this.emitFilters();
  }

  // Dropdown controls
  togglePriorityDropdown(event: Event): void {
    event.stopPropagation();
    this.showPriorityDropdown.update((v) => !v);
    this.showAssigneeDropdown.set(false);
    this.showTypeDropdown.set(false);
    this.showStatusDropdown.set(false);
  }

  toggleAssigneeDropdown(event: Event): void {
    event.stopPropagation();
    this.showAssigneeDropdown.update((v) => !v);
    this.showPriorityDropdown.set(false);
    this.showTypeDropdown.set(false);
    this.showStatusDropdown.set(false);
  }

  toggleTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.showTypeDropdown.update((v) => !v);
    this.showPriorityDropdown.set(false);
    this.showAssigneeDropdown.set(false);
    this.showStatusDropdown.set(false);
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.showStatusDropdown.update((v) => !v);
    this.showPriorityDropdown.set(false);
    this.showAssigneeDropdown.set(false);
    this.showTypeDropdown.set(false);
  }

  closeAllDropdowns(): void {
    this.showPriorityDropdown.set(false);
    this.showAssigneeDropdown.set(false);
    this.showTypeDropdown.set(false);
    this.showStatusDropdown.set(false);
  }

  // Mobile drawer controls
  toggleMobileFilters(): void {
    this.showMobileDrawer.update((show) => !show);
    if (this.showMobileDrawer()) {
      // Close all desktop dropdowns when mobile drawer opens
      this.closeAllDropdowns();
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileFilters(): void {
    this.showMobileDrawer.set(false);
    document.body.style.overflow = '';
  }

  // Emit filters
  private emitFilters(): void {
    this.filtersChanged.emit(this.filters());
  }

  // Helpers for template
  getPriorityLabel = getPriorityLabel;
  getPriorityBgColor = getPriorityBgColor;
  getPriorityTextColor = getPriorityTextColor;

  getUserAvatar(user: any): string {
    return user?.avatar_url || user?.profile_picture || '';
  }

  getUserInitials(user: any): string {
    const fullName = user?.full_name || user?.email || '?';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  getIssueTypeIcon(type: any): string {
    const iconMap: Record<string, string> = {
      'bug': '🐛',
      'task': '✓',
      'story': '📖',
      'epic': '⚡',
      'feature': '✨',
    };
    return iconMap[type?.name?.toLowerCase()] || '📝';
  }
}
