import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectConfig, Sprint } from '../../../core/models/interfaces';
import { ProjectStatusEnum, ProjectPriorityEnum } from '../../../core/models/enums';
import { SprintCreateComponent } from '../project-sprints/sprint-create/sprint-create.component';
import { SprintListComponent } from '../project-sprints/sprint-list/sprint-list.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule,
    RouterLink,
    SprintCreateComponent,
    SprintListComponent,
  ],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  project = signal<Project | null>(null);
  sprint = signal<Sprint | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  projectConfig = signal<ProjectConfig | null>(null);
  openModal = signal(false);


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProject(id);
      }
    });
  }

  async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const project = await this.projectService.getProject(id).toPromise();
      if (project) {
        this.project.set(project);
        await this.loadConfigProject(id);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  async loadConfigProject(id: string): Promise<void> {
    /*En caso que tengan configuraciones iniciales*/
    this.loading.set(true);
    this.error.set(null);
    try {
      const config = await this.projectService.getProjectConfig(id).toPromise();
      if (config) {
        this.projectConfig.set(config);
      }
    } catch (error: any) {
      if (error.status === 404) {
        this.projectConfig.set(null);
      } else {
        this.error.set(error.error?.message || 'Failed to load project configuration');
      }
    } finally {
      this.loading.set(false);
    }
  }



  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  showSprintModal(): void {
    this.openModal.set(true);
  }  

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
