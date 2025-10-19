import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService } from '../../../../core/services/issue.service';
import { PaginationParams, Issue } from '../../../../core/models/interfaces';
import { PaginatedIssueList } from '../../../../core/models/api-interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { IssueCreateComponent } from '../issue-create/issue-create.component';
import { IssueDetailComponent } from '../issue-detail/issue-detail.component';
import { IssueEditComponent } from '../issue-edit/issue-edit.component';

@Component({
  selector: 'app-issue-list',
  imports: [CommonModule, IssueCreateComponent, IssueDetailComponent, IssueEditComponent],
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.css'
})
export class IssueListComponent {
  @Input() projectId!: string;

  private issueService = inject(IssueService)
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  issues = signal<Issue[]>([]);
  paginationData = signal<PaginatedIssueList | null>(null);
  
  // Modal states
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  showEditModal = signal(false);
  selectedIssueId = signal<string | null>(null);

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId') || '';
    this.projectId = projectId;
    // Pasar el parámetro project para que el backend filtre
    this.loadIssues({ project: this.projectId });
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
      const result = await this.issueService.getIssues(params).toPromise();
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
    // Vuelve a la página de detalle del proyecto
    this.router.navigate(['/projects']);
  }
}
