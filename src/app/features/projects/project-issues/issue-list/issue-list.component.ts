import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService } from '../../../../core/services/issue.service';
import { PaginationParams, Issue } from '../../../../core/models/interfaces';
import { PaginatedIssueList } from '../../../../core/models/api-interfaces';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IssueCreateComponent } from '../issue-create/issue-create.component';
import { IssueDetailComponent } from '../issue-detail/issue-detail.component';
import { IssueEditComponent } from '../issue-edit/issue-edit.component';
import { IssueAssignComponent } from '../issue-assign/issue-assign.component';
@Component({
  selector: 'app-issue-list',
  imports: [CommonModule, RouterLink, IssueCreateComponent, IssueDetailComponent, IssueEditComponent, IssueAssignComponent],
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.css'
})
export class IssueListComponent {
  // Estado para el menú desplegable de prioridad por issue
  private priorityMenuOpenMap = new Map<string, boolean>();

  isPriorityMenuOpen(issueId: string): boolean {
    return !!this.priorityMenuOpenMap.get(issueId);
  }

  openPriorityMenu(issueId: string): void {
    this.priorityMenuOpenMap.set(issueId, true);
  }

  closePriorityMenu(issueId: string): void {
    this.priorityMenuOpenMap.set(issueId, false);
  }

  togglePriorityMenu(issueId: string): void {
    this.priorityMenuOpenMap.set(issueId, !this.isPriorityMenuOpen(issueId));
  }

    // Estado para el menú desplegable de estado por issue
  public statusMenuOpenMap = new Map<string, boolean>();

  public isStatusMenuOpen(issueId: string): boolean {
    return !!this.statusMenuOpenMap.get(issueId);
  }

  public openStatusMenu(issueId: string): void {
    this.statusMenuOpenMap.set(issueId, true);
  }

  public closeStatusMenu(issueId: string): void {
    this.statusMenuOpenMap.set(issueId, false);
  }

  public toggleStatusMenu(issueId: string): void {
    this.statusMenuOpenMap.set(issueId, !this.isStatusMenuOpen(issueId));
  }

  // Opciones de transición/estado
  public readonly STATUS_OPTIONS = [
    { value: 'to_do', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  public convertirStatus(status: string | null): string {
    const found = this.STATUS_OPTIONS.find(opt => opt.value === status);
    return found ? found.label : (status || 'Sin estado');
  }

  @Input() projectId!: string;

  private issueService = inject(IssueService)
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  issues = signal<Issue[]>([]);
  paginationData = signal<PaginatedIssueList | null>(null);
  projectName = signal<string>('');

  // Modal states
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  showEditModal = signal(false);
  showAssignModal = signal(false);
  selectedIssueId = signal<string | null>(null);
  // Asignar Issue
  openAssignModal(issueId: string): void {
    this.selectedIssueId.set(issueId);
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.selectedIssueId.set(null);
  }

  onIssueAssigned(): void {
    this.closeAssignModal();
    this.loadIssues({ project: this.projectId });
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId') || '';
    this.projectId = projectId;

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['projectName']) {
      this.projectName.set(navigation.extras.state['projectName']);
    }

    this.loadIssues({ project: this.projectId });
  }

  // Mapeo de prioridades para mostrar y enviar
  readonly PRIORITY_OPTIONS = [
    { value: 'P1', label: 'Critical' },
    { value: 'P2', label: 'High' },
    { value: 'P3', label: 'Medium' },
    { value: 'P4', label: 'Low' },
  ];

  convertirPriority(priority: string | null): string {
    const found = this.PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return found ? found.label : (priority || 'Sin prioridad');
  }

  getPriorityValueFromLabel(label: string): string | null {
    const found = this.PRIORITY_OPTIONS.find(opt => opt.label === label);
    return found ? found.value : null;
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

  async updateIssuePriority(issueId: string, priority: string): Promise<void> {
    try {
      await this.issueService.updateIssuePriority(issueId, priority).toPromise();
      this.closePriorityMenu(issueId);
      this.loadIssues({ project: this.projectId });
    } catch (error) {
      console.error('Error updating issue priority:', error);
      this.error.set('Error al actualizar la prioridad de la issue');
    }
  }

  async updateIssueStatus(issueId: string, status: string | null, ): Promise<void> {
    try {
      await this.issueService.updateIssueTransition(issueId, status).toPromise();
      this.loadIssues({ project: this.projectId });
    } catch (error) {
      console.log('datos mandando', issueId, 'Status_UUID',status);
      console.error('Error updating issue status:', error);
      this.error.set('Error al actualizar el estado de la issue');
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
