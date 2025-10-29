import { Component, inject, Input, signal } from '@angular/core';
import { SprintsService } from '../../../../core/services/sprints.service';
import { IssueService } from '../../../../core/services/issue.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Sprint, PaginationParams, Project, Issue } from '../../../../core/models/interfaces';
import { PaginatedSprintList } from '../../../../core/models/api-interfaces';
import { ProjectStatusEnum } from '../../../../core/models/enums';
import { CommonModule } from '@angular/common';
import { SprintDetailComponent } from '../sprint-detail/sprint-detail.component';
import { SprintEditComponent } from '../sprint-edit/sprint-edit.component';
import { AddIssuesToSprintDialogComponent } from '../add-issues-to-sprint-dialog/add-issues-to-sprint-dialog.component';
import { Router } from '@angular/router';
import { TableModule } from "primeng/table";
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-sprint-list',
  imports: [
    CommonModule,
    SprintDetailComponent,
    SprintEditComponent,
    AddIssuesToSprintDialogComponent,
    TableModule
],
  templateUrl: './sprint-list.component.html',
  styleUrl: './sprint-list.component.css'
})
export class SprintListComponent {
  async removeIssueFromSprint(sprintId: string, issueId: string): Promise<void> {
    try {
      await this.sprintService.removeIssueFromSprint(sprintId, issueId).toPromise();
      this.notificationService.success('Issue removed from sprint');
      await this.loadSprints();
    } catch (error) {
      this.notificationService.error('Error removing issue from sprint');
      console.error(error);
    }
  }
  @Input() projectId!: string;
  @Input() projectName?: string;
  @Input() sprintId!: string;
  private sprintService = inject(SprintsService);
  private issueService = inject(IssueService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  sprints = signal<Sprint[]>([]);
  paginationData = signal<PaginatedSprintList | null>(null);
  project = signal<Project | null>(null);
  openModalDetail = signal(false);
  openModalEdit = signal(false);
  currentSprintId = signal<string | null>(null);
  showActionsMenu = signal<string | null>(null);
  // Add Issues to Sprint Dialog
  showAddIssuesDialog = signal(false);
  selectedSprint = signal<Sprint | null>(null);

  ngOnInit(): void {
    if (this.projectId) {
      this.loadSprints();
    } else {
      this.sprints.set([]);
    }
  }

  async loadSprints(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      console.log('[SPRINT LIST] Loading sprints for project:', this.projectId);
      const result = await this.sprintService.getSprints(this.projectId, params).toPromise();
      if (result) {
        console.log('[SPRINT LIST] API Response:', result);
        console.log('[SPRINT LIST] Sprints count:', result.results.length);
        
        const filtered = result.results.filter(sprint => sprint.project.id === this.projectId);
        
        // Load issues for each sprint (JIRA architecture: issues belong to sprints)
        const sprintsWithIssues = await Promise.all(
          filtered.map(async (sprint) => {
            try {
              console.log(`[SPRINT LIST] Loading issues for sprint: ${sprint.name}`);
              const issuesResult = await this.issueService.getIssues({ sprint: sprint.id }).toPromise();
              const issues = issuesResult?.results || [];
              console.log(`[SPRINT LIST] Sprint "${sprint.name}" has ${issues.length} issues (issue_count=${sprint.issue_count})`);
              return { ...sprint, issues };
            } catch (error) {
              console.error(`[SPRINT LIST] Error loading issues for sprint ${sprint.id}:`, error);
              return { ...sprint, issues: [] };
            }
          })
        );
        
        this.sprints.set(sprintsWithIssues);
        this.paginationData.set(result);
        
        console.log('[SPRINT LIST] All sprints loaded with issues:', sprintsWithIssues.map(s => ({
          name: s.name,
          issue_count: s.issue_count,
          loaded_issues: s.issues?.length || 0
        })));
      }
    } catch (error) {
      this.error.set('Error loading sprints');
      console.error('[SPRINT LIST] Error loading sprints:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteSprint(sprintId: string): Promise<void> {
    const sprint = this.sprints().find(s => s.id === sprintId);
    
    if (!sprint) {
      this.notificationService.error('Sprint not found');
      return;
    }
    
    // Prevenir eliminación de sprint activo
    if (sprint.status === ProjectStatusEnum.ACTIVE) {
      this.notificationService.warning(
        'Cannot Delete Active Sprint',
        `Sprint "${sprint.name}" is currently active. Please close it before deleting.`,
        6000
      );
      return;
    }
    
    // Confirmación de eliminación
    const confirmed = confirm(
      `Are you sure you want to delete "${sprint.name}"?\n\n` +
      `This action cannot be undone. All sprint data will be permanently removed.`
    );
    
    if (!confirmed) {
      return;
    }
    
    this.loading.set(true);
    try {
      await this.sprintService.deleteSprint(sprintId).toPromise();
      this.notificationService.success(`Sprint "${sprint.name}" deleted successfully`);
      await this.loadSprints();
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Error al eliminar el sprint';
      this.error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  showDetailSprintModal(sprintId: string): void {
    this.currentSprintId.set(sprintId);
    this.openModalDetail.set(true);
    this.showActionsMenu.set(null);
  }

  showEditSprintModal(sprintId: string): void {
    this.currentSprintId.set(sprintId);
    this.openModalEdit.set(true);
    this.showActionsMenu.set(null);
  }

  closeDetailModal(): void {
    this.openModalDetail.set(false);
    this.currentSprintId.set(null);
  }

  closeEditModal(): void {
    this.openModalEdit.set(false);
    this.currentSprintId.set(null);
  }

  toggleActionsMenu(sprintId: string): void {
    if (this.showActionsMenu() === sprintId) {
      this.showActionsMenu.set(null);
    } else {
      this.showActionsMenu.set(sprintId);
    }
  }

  async startSprint(sprintId: string): Promise<void> {
    // VALIDACIÓN CRÍTICA: Sprint debe tener al menos 1 issue
    const sprint = this.sprints().find(s => s.id === sprintId);
    
    if (!sprint) {
      this.notificationService.error('Sprint not found');
      return;
    }
    
    const issueCount = parseInt(sprint.issue_count || '0', 10);
    
    if (issueCount === 0) {
      this.showSprintEmptyWarning(sprint);
      return;
    }
    
    // Validar que no haya otro sprint activo
    const activeSprint = this.sprints().find(s => s.status === ProjectStatusEnum.ACTIVE);
    if (activeSprint && activeSprint.id !== sprintId) {
      this.notificationService.warning(
        'Sprint Already Active',
        `Sprint "${activeSprint.name}" is already active. Close it before starting a new one.`,
        6000
      );
      return;
    }
    
    this.loading.set(true);
    try {
      await this.sprintService.starSprint(sprintId).toPromise();
      this.notificationService.success(`Sprint "${sprint.name}" started successfully!`);
      await this.loadSprints(); // Recargar para actualizar estados
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Error al iniciar el sprint';
      this.error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
  
  private showSprintEmptyWarning(sprint: Sprint): void {
    this.notificationService.warning(
      'Sprint Cannot Start',
      `Sprint "${sprint.name}" has no issues. Please add at least one issue before starting the sprint.`,
      6000
    );
  }

  async completeSprint(sprintId: string): Promise<void> {
    const sprint = this.sprints().find(s => s.id === sprintId);
    
    if (!sprint) {
      this.notificationService.error('Sprint not found');
      return;
    }

    if (sprint.status !== ProjectStatusEnum.ACTIVE) {
      this.notificationService.warning(
        'Invalid Operation',
        'Only active sprints can be completed.',
        6000
      );
      return;
    }

    const confirmed = confirm(
      `Complete sprint "${sprint.name}"?\n\n` +
      `This will move all incomplete issues to the backlog.`
    );

    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    try {
      await this.sprintService.completeSprint(sprintId).toPromise();
      this.notificationService.success(`Sprint "${sprint.name}" completed successfully!`);
      await this.loadSprints();
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Error completing sprint';
      this.error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error(error);
    } finally {
      this.loading.set(false);
      this.showActionsMenu.set(null);
    }
  }

  canStartSprint(sprint: Sprint): boolean {
    const issueCount = this.getIssueCount(sprint);
    return issueCount > 0;
  }

  getIssueCount(sprint: Sprint): number {
    return parseInt(sprint.issue_count || '0', 10);
  }

  getStartSprintTooltip(sprint: Sprint): string {
    if (!this.canStartSprint(sprint)) {
      return 'Sprint must have at least 1 issue before starting';
    }
    return 'Start this sprint';
  }

  getStatusBadgeClass(status: ProjectStatusEnum): string {
    switch (status) {
      case ProjectStatusEnum.PLANNING:
        return 'status-planning';
      case ProjectStatusEnum.ACTIVE:
        return 'status-active';
      case ProjectStatusEnum.COMPLETED:
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: ProjectStatusEnum): string {
    switch (status) {
      case ProjectStatusEnum.PLANNING:
        return 'Planning';
      case ProjectStatusEnum.ACTIVE:
        return 'Active';
      case ProjectStatusEnum.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  }

  formatDateRange(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };

    const startFormatted = start.toLocaleDateString('en-US', formatOptions);
    const endFormatted = end.toLocaleDateString('en-US', formatOptions);

    return `${startFormatted} - ${endFormatted}`;
  }

  navigateToIssues(sprint: Sprint): void {
    this.router.navigate(['/projects', this.projectId, 'issues'], {
      queryParams: { sprint: sprint.id },
      state: { projectName: this.projectName || 'Project' }
    });
  }

  /**
   * Get issue type badge class (professional colors)
   */
  getIssueTypeBadgeClass(issueTypeName?: string): string {
    if (!issueTypeName) return 'bg-gray-100 text-gray-800';
    const type = issueTypeName.toLowerCase();
    if (type.includes('bug')) return 'bg-red-100 text-red-800';
    if (type.includes('task')) return 'bg-blue-100 text-blue-800';
    if (type.includes('story')) return 'bg-green-100 text-green-800';
    if (type.includes('epic')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Get issue type short label
   */
  getIssueTypeLabel(issueTypeName?: string): string {
    if (!issueTypeName) return 'Issue';
    const type = issueTypeName.toLowerCase();
    if (type.includes('bug')) return 'Bug';
    if (type.includes('task')) return 'Task';
    if (type.includes('story')) return 'Story';
    if (type.includes('epic')) return 'Epic';
    return 'Issue';
  }

  /**
   * Get priority CSS class
   */
  getPriorityClass(priority: string | null): string {
    switch (priority) {
      case 'P1': return 'priority-critical';
      case 'P2': return 'priority-high';
      case 'P3': return 'priority-medium';
      case 'P4': return 'priority-low';
      default: return 'priority-default';
    }
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string | null): string {
    switch (priority) {
      case 'P1': return 'Critical';
      case 'P2': return 'High';
      case 'P3': return 'Medium';
      case 'P4': return 'Low';
      default: return 'None';
    }
  }

  /**
   * Open dialog to add issues to sprint (JIRA architecture)
   */
  openAddIssuesDialog(sprint: Sprint): void {
    console.log('[SPRINT] Opening add issues dialog for:', sprint.name);
    this.selectedSprint.set(sprint);
    this.showAddIssuesDialog.set(true);
  }
  
  /**
   * Handle issues added to sprint
   */
  onIssuesAdded(): void {
    console.log('[SPRINT] Issues added successfully, reloading sprints');
    this.showAddIssuesDialog.set(false);
    this.selectedSprint.set(null);
    // Reload sprints to update counts and issue lists
    this.loadSprints();
  }
  
  /**
   * Handle dialog canceled
   */
  onAddIssuesDialogCanceled(): void {
    console.log('[SPRINT] Add issues dialog canceled');
    this.showAddIssuesDialog.set(false);
    this.selectedSprint.set(null);
  }

}
