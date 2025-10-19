import { Component, inject, Input, signal } from '@angular/core';
import { SprintsService } from '../../../../core/services/sprints.service';
import { Sprint, PaginationParams, Project } from '../../../../core/models/interfaces';
import { PaginatedSprintList } from '../../../../core/models/api-interfaces';
import { CommonModule } from '@angular/common';
import { SprintDetailComponent } from '../sprint-detail/sprint-detail.component';
import { SprintEditComponent } from '../sprint-edit/sprint-edit.component';
@Component({
  selector: 'app-sprint-list',
  imports: [
    CommonModule,
    SprintDetailComponent,
    SprintEditComponent
  ],
  templateUrl: './sprint-list.component.html',
  styleUrl: './sprint-list.component.css'
})
export class SprintListComponent {
  @Input() projectId!: string;
  @Input() sprintId!: string;
  private sprintService = inject(SprintsService);

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
    this.loading.set(true);
    try {
      await this.sprintService.deleteSprint(sprintId).toPromise();
      await this.loadSprints();
    } catch (error) {
      this.error.set('Error al eliminar el sprint');
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
    this.loading.set(true);
    try {
      await this.sprintService.starSprint(sprintId).toPromise();
    } catch (error) {
      this.error.set('Error al iniciar el sprint');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

}
