import { Component, inject, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IssueService } from '../../../../core/services/issue.service';
import { PaginationParams, Issue } from '../../../../core/models/interfaces';
import { PaginatedIssueList } from '../../../../core/models/api-interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { IssueCreateComponent } from '../issue-create/issue-create.component';
import { IssueDetailComponent } from '../issue-detail/issue-detail.component';
import { IssueEditComponent } from '../issue-edit/issue-edit.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IssueCreateComponent, IssueDetailComponent, IssueEditComponent],
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.css'
})
export class IssueListComponent implements OnInit {
  @Input() projectId!: string;

  private issueService = inject(IssueService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  issues = signal<Issue[]>([]);
  paginationData = signal<PaginatedIssueList | null>(null);
  projectName = signal<string>('');
  
  // Modal states
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  showEditModal = signal(false);
  selectedIssueId = signal<string | null>(null);
  
  // Search & Filter states
  showFilters = signal(false);
  showAdvancedSearch = signal(false);
  savedFilters = signal<any[]>([]);
  
  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  
  // Filter form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    status_name: [''],  // Changed from 'status' to 'status_name'
    priority: [''],
    assignee_email: [''],  // Changed from 'assignee' to 'assignee_email'
    issue_type_category: [''],  // Changed from 'issue_type' to 'issue_type_category'
    sprint: [''],
    ordering: ['-created_at']
  });

  ngOnInit(): void {
    // Get project ID from route params
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId = id;
        this.loadIssues();
      }
    });
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterForm.patchValue({ search: searchTerm });
      this.applyFilters();
    });
    
    // Load saved filters from localStorage
    this.loadSavedFilters();
  }

  convertirPriority(priority: string | null): string {
    switch (priority) {
      case 'P1':
        return 'Critical';
      case 'P2':
        return 'High';
      case 'P3':
        return 'Medium';
      case 'P4':
        return 'Low';
      default:
        return priority || 'Sin prioridad';
    }
  }

  async loadIssues(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const filters = {
        project: this.projectId,
        ...params
      };
      const result = await this.issueService.getIssues(filters).toPromise();
      if (result) {
        this.issues.set(result?.results);
        this.paginationData.set(result || null);
      }
    } catch (error) {
      this.error.set('Error loading issues');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
  
  // UC-064: Search issues by text
  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }
  
  // UC-065: Filter issues by criteria
  applyFilters(): void {
    const formValue = this.filterForm.value;
    const params: any = {};
    
    // Only include non-empty values
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== '' && formValue[key] !== null) {
        params[key] = formValue[key];
      }
    });
    
    this.loadIssues(params);
  }
  
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      ordering: '-created_at'
    });
    this.applyFilters();
  }
  
  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }
  
  // UC-066: Save custom filters
  saveCurrentFilter(): void {
    const filterName = prompt('Enter a name for this filter:');
    if (!filterName) return;
    
    const filter = {
      id: Date.now().toString(),
      name: filterName,
      filters: this.filterForm.value,
      createdAt: new Date().toISOString()
    };
    
    const filters = this.savedFilters();
    filters.push(filter);
    this.savedFilters.set(filters);
    
    // Save to localStorage
    localStorage.setItem(`saved-filters-${this.projectId}`, JSON.stringify(filters));
  }
  
  loadSavedFilters(): void {
    const saved = localStorage.getItem(`saved-filters-${this.projectId}`);
    if (saved) {
      this.savedFilters.set(JSON.parse(saved));
    }
  }
  
  applySavedFilter(filter: any): void {
    this.filterForm.patchValue(filter.filters);
    this.applyFilters();
  }
  
  deleteSavedFilter(filterId: string): void {
    const filters = this.savedFilters().filter(f => f.id !== filterId);
    this.savedFilters.set(filters);
    localStorage.setItem(`saved-filters-${this.projectId}`, JSON.stringify(filters));
  }
  
  // UC-067: Advanced search (JQL basic)
  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update(v => !v);
  }

  // Modal methods
  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onIssueCreated(): void {
    this.closeCreateModal();
    this.loadIssues({ project: this.projectId });
  }

  viewIssue(issueId: string): void {
    this.selectedIssueId.set(issueId);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedIssueId.set(null);
  }

  editIssue(issueId: string): void {
    this.selectedIssueId.set(issueId);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedIssueId.set(null);
  }

  onIssueUpdated(): void {
    this.closeEditModal();
    this.loadIssues({ project: this.projectId });
  }

  async deleteIssue(issueId: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar esta issue?')) {
      try {
        await this.issueService.deleteIssue(issueId).toPromise();
        this.loadIssues({ project: this.projectId });
      } catch (error) {
        console.error('Error deleting issue:', error);
        this.error.set('Error al eliminar la issue');
      }
    }
  }

  goBack(): void {
    if (this.projectId) {
      this.router.navigate(['/projects', this.projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
