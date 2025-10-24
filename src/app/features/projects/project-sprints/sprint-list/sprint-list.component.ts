import { Component, inject, Input, signal } from '@angular/core';
import { SprintsService } from '../../../../core/services/sprints.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Sprint, PaginationParams, Project } from '../../../../core/models/interfaces';
import { PaginatedSprintList } from '../../../../core/models/api-interfaces';
import { ProjectStatusEnum } from '../../../../core/models/enums';
import { CommonModule } from '@angular/common';
import { SprintDetailComponent } from '../sprint-detail/sprint-detail.component';
import { SprintEditComponent } from '../sprint-edit/sprint-edit.component';
import { RouterLink } from '@angular/router';
import { TableModule } from "primeng/table";
@Component({
  selector: 'app-sprint-list',
  imports: [
    CommonModule,
    SprintDetailComponent,
    SprintEditComponent,
    RouterLink,
    TableModule
],
  templateUrl: './sprint-list.component.html',
  styleUrl: './sprint-list.component.css'
})
export class SprintListComponent {
  @Input() projectId!: string;
  @Input() sprintId!: string;
  private sprintService = inject(SprintsService);
  private notificationService = inject(NotificationService);

  loading = signal(false);
  error = signal<string | null>(null);
  sprints = signal<Sprint[]>([]);
  paginationData = signal<PaginatedSprintList | null>(null);
  project = signal<Project | null>(null);
  openModalDetail = signal(false);
  openModalEdit = signal(false);

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
      const result = await this.sprintService.getSprints(this.projectId, params).toPromise();
      if (result) {
        // Filtrar por projectId por seguridad
        const filtered = result.results.filter(sprint => sprint.project.id === this.projectId);
        this.sprints.set(filtered);
        this.paginationData.set(result);
      }
    } catch (error) {
      this.error.set('Error loading sprints');
      console.error(error);
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

  showDetailSprintModal(): void {
    this.openModalDetail.set(true);
  }

  showEditSprintModal(): void {
    this.openModalEdit.set(true);
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

}
