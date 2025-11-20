import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, ActivatedRoute} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {ProjectService} from '../../../core/services/project.service';
import {Project, PaginatedProjectList, PaginationParams} from '../../../core/models/interfaces';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './projects-list.component.html',
})
export class ProjectsListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  projects = signal<Project[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  paginationData = signal<PaginatedProjectList | null>(null);
  currentPage = signal(1);
  workspaceId = signal<string | null>(null);

  searchForm: FormGroup = this.fb.group({
    search: [''],
    status: [''],
    priority: [''],
    ordering: ['-created_at'],
  });

  Math = Math;

  ngOnInit(): void {
    // Read workspace ID from URL query params
    this.route.queryParams.subscribe((params) => {
      this.workspaceId.set(params['workspace'] || null);
      this.loadProjects();
    });
  }

  async loadProjects(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    // Always include workspace filter if present
    const filterParams: PaginationParams = {
      ...params,
      workspace: this.workspaceId() || undefined,
    };

    try {
      const response = await this.projectService.getProjects(filterParams).toPromise();
      if (response) {
        const normalizeProjects = response.results.map((project) => ({
          ...project,
          workspace: project.workspace || {name: 'Sin workspace'},
        }));
        this.projects.set(normalizeProjects);
        this.paginationData.set(response);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load projects');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    const searchParams: PaginationParams = {
      page: 1,
      search: this.searchForm.value.search || undefined,
      status: this.searchForm.value.status || undefined,
      priority: this.searchForm.value.priority || undefined,
      ordering: this.searchForm.value.ordering || undefined,
    };

    this.currentPage.set(1);
    this.loadProjects(searchParams);
  }

  loadPage(page: number): void {
    if (page < 1) return;

    const searchParams: PaginationParams = {
      page,
      search: this.searchForm.value.search || undefined,
      status: this.searchForm.value.status || undefined,
      priority: this.searchForm.value.priority || undefined,
      ordering: this.searchForm.value.ordering || undefined,
    };

    this.currentPage.set(page);
    this.loadProjects(searchParams);
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
}
