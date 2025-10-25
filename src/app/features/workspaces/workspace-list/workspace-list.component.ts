import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspacesService } from '../../../core/services/workspaces.service';
import { Workspace, PaginatedWorkspaceList, ApiQueryParams } from '../../../core/models/interfaces';
import { WorkspaceTypeEnum, VisibilityEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './workspace-list.component.html'
})
export class WorkspaceListComponent implements OnInit {
  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  error = signal('');
  
  organizationId = signal('');
  organizationName = signal('');
  
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = 12;
  
  searchTerm = signal('');
  selectedType = signal<string>('');
  selectedVisibility = signal<string>('');
  sortBy = signal('created_at');
  
  workspaceTypes = Object.values(WorkspaceTypeEnum);
  visibilityOptions = Object.values(VisibilityEnum);

  filteredCount = computed(() => this.workspaces().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize));
  hasWorkspaces = computed(() => this.workspaces().length > 0);
  showPagination = computed(() => this.totalRecords() > this.pageSize);

  constructor(
    private workspacesService: WorkspacesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('[WORKSPACE-LIST] ngOnInit() called');
    this.route.queryParams.subscribe(params => {
      console.log('[WORKSPACE-LIST] Query params received:', params);
      this.organizationId.set(params['organization'] || '');
      console.log('[WORKSPACE-LIST] Organization ID set to:', this.organizationId());
      this.loadWorkspaces(); // ALWAYS load, like Organizations/Projects components
    });
  }

  loadWorkspaces(): void {
    console.log('[WORKSPACE-LIST] loadWorkspaces() called');
    console.log('[WORKSPACE-LIST] Params:', {
      page: this.currentPage(),
      search: this.searchTerm(),
      type: this.selectedType(),
      ordering: this.sortBy(),
      organizationId: this.organizationId()
    });
    
    this.loading.set(true);
    this.error.set('');

    const params: ApiQueryParams = {
      page: this.currentPage(),
      search: this.searchTerm() || undefined,
      workspace_type: this.selectedType() || undefined,
      ordering: this.sortBy()
    };

    console.log('[WORKSPACE-LIST] Calling workspacesService.getWorkspaces()');
    
    this.workspacesService.getWorkspaces(params).subscribe({
      next: (response: PaginatedWorkspaceList) => {
        console.log('[WORKSPACE-LIST] Response received:', response);
        console.log('[WORKSPACE-LIST] Count:', response.count);
        console.log('[WORKSPACE-LIST] Results length:', response.results?.length || 0);
        
        this.workspaces.set(response.results || []);
        this.totalRecords.set(response.count);
        this.loading.set(false);

        if (response.results.length > 0 && response.results[0].organization_details) {
          this.organizationName.set(response.results[0].organization_details.name);
        }
      },
      error: (err: Error) => {
        console.error('[WORKSPACE-LIST] Error:', err);
        console.error('[WORKSPACE-LIST] Error message:', err.message);
        this.error.set(err.message || 'Failed to load workspaces');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  onSortChange(sortField: string): void {
    this.sortBy.set(sortField);
    this.loadWorkspaces();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedType.set('');
    this.selectedVisibility.set('');
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      this.loadWorkspaces();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.loadWorkspaces();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadWorkspaces();
  }

  createWorkspace(): void {
    this.router.navigate(['/workspaces/create'], {
      queryParams: { organization: this.organizationId() }
    });
  }

  viewWorkspace(workspace: Workspace): void {
    this.router.navigate(['/workspaces', workspace.id]);
  }

  goBack(): void {
    this.router.navigate(['/organizations']);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'development': 'Development',
      'design': 'Design',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'support': 'Support',
      'hr': 'Human Resources',
      'finance': 'Finance',
      'general': 'General',
      'team': 'Team',
      'project': 'Project',
      'department': 'Department',
      'other': 'Other'
    };
    return labels[type] || type;
  }

  getVisibilityBadgeClass(visibility: string): string {
    const classes: Record<string, string> = {
      'public': 'bg-green-100 text-green-800',
      'private': 'bg-gray-100 text-gray-800',
      'restricted': 'bg-yellow-100 text-yellow-800'
    };
    return classes[visibility] || 'bg-gray-100 text-gray-800';
  }

  getTypeInitials(type: string): string {
    const initials: Record<string, string> = {
      'development': 'DEV',
      'design': 'DES',
      'marketing': 'MKT',
      'sales': 'SLS',
      'support': 'SUP',
      'hr': 'HR',
      'finance': 'FIN',
      'general': 'GEN',
      'team': 'TM',
      'project': 'PRJ',
      'department': 'DEPT',
      'other': 'OTH'
    };
    return initials[type] || 'WSP';
  }

  getTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'development': 'bg-blue-100 text-blue-800',
      'design': 'bg-purple-100 text-purple-800',
      'marketing': 'bg-pink-100 text-pink-800',
      'sales': 'bg-green-100 text-green-800',
      'support': 'bg-orange-100 text-orange-800',
      'hr': 'bg-indigo-100 text-indigo-800',
      'finance': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800',
      'team': 'bg-teal-100 text-teal-800',
      'project': 'bg-cyan-100 text-cyan-800',
      'department': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }
}
