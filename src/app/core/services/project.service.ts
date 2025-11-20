import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  Project,
  ProjectRequest,
  ProjectConfig,
  ProjectConfigRequest,
  PaginatedProjectList,
  PaginationParams,
  ProjectMember,
  ProjectMemberRequest,
  PatchedProjectMemberRequest,
  PaginatedProjectMemberList,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/projects`;

  getProjects(params?: PaginationParams): Observable<PaginatedProjectList> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.workspace) {
      httpParams = httpParams.set('workspace', params.workspace);
    }

    return this.http.get<PaginatedProjectList>(`${this.baseUrl}/projects/`, {params: httpParams});
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}/`);
  }

  createProject(projectData: ProjectRequest): Observable<Project> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (projectData.cover_image || projectData.attachments) {
      headers.delete('Content-Type');
      const formData = new FormData();

      formData.append('name', projectData.name);
      formData.append('slug', projectData.slug);
      formData.append('workspace', projectData.workspace);

      if (projectData.key) {
        formData.append('key', projectData.key);
      }
      if (projectData.description) {
        formData.append('description', projectData.description);
      }
      if (projectData.methodology) {
        formData.append('methodology', projectData.methodology);
      }
      if (projectData.status) {
        formData.append('status', projectData.status);
      }
      if (projectData.priority) {
        formData.append('priority', projectData.priority);
      }
      if (projectData.start_date) {
        formData.append('start_date', projectData.start_date);
      }
      if (projectData.due_date) {
        formData.append('due_date', projectData.due_date);
      }
      if (projectData.end_date) {
        formData.append('end_date', projectData.end_date);
      }
      if (projectData.estimated_hours !== undefined) {
        formData.append('estimated_hours', projectData.estimated_hours.toString());
      }
      if (projectData.budget !== undefined) {
        formData.append('budget', projectData.budget.toString());
      }
      if (projectData.cover_image) {
        formData.append('cover_image', projectData.cover_image);
      }
      if (projectData.attachments) {
        formData.append('attachments', projectData.attachments);
      }
      if (projectData.project_settings) {
        formData.append('project_settings', JSON.stringify(projectData.project_settings));
      }
      if (projectData.is_active !== undefined) {
        formData.append('is_active', projectData.is_active.toString());
      }
      return this.http.post<Project>(`${this.baseUrl}/projects/`, formData);
    }

    return this.http.post<Project>(`${this.baseUrl}/projects/`, projectData, {headers});
  }

  updateProject(id: string, projectData: Partial<ProjectRequest>): Observable<Project> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    /* const formData = new FormData();

    if (projectData.name) {
      formData.append('name', projectData.name);
    }
    if (projectData.slug) {
      formData.append('slug', projectData.slug);
    }
    if (projectData.workspace) {
      formData.append('workspace', projectData.workspace);
    }
    if (projectData.key) {
      formData.append('key', projectData.key);
    }
    if (projectData.description) {
      formData.append('description', projectData.description);
    }
    if (projectData.methodology) {
      formData.append('methodology', projectData.methodology);
    }
    if (projectData.status) {
      formData.append('status', projectData.status);
    }
    if (projectData.priority) {
      formData.append('priority', projectData.priority);
    }
    if (projectData.start_date) {
      formData.append('start_date', projectData.start_date);
    }
    if (projectData.due_date) {
      formData.append('due_date', projectData.due_date);
    }
    if (projectData.end_date) {
      formData.append('end_date', projectData.end_date);
    }
    if (projectData.estimated_hours !== undefined) {
      formData.append('estimated_hours', projectData.estimated_hours.toString());
    }
    if (projectData.budget !== undefined) {
      formData.append('budget', projectData.budget.toString());
    }
    if (projectData.cover_image) {
      formData.append('cover_image', projectData.cover_image);
    }
    if (projectData.attachments) {
      formData.append('attachments', projectData.attachments);
    }
    if (projectData.project_settings) {
      formData.append('project_settings', JSON.stringify(projectData.project_settings));
    }
    if (projectData.is_active !== undefined) {
      formData.append('is_active', projectData.is_active.toString());
    }*/

    return this.http.patch<Project>(`${this.baseUrl}/projects/${id}/`, projectData, {headers});
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}/`);
  }

  // Project Configuration
  getProjectConfig(projectId: string): Observable<ProjectConfig> {
    return this.http.get<ProjectConfig>(`${this.baseUrl}/configs/${projectId}/`);
  }

  updateProjectConfig(projectId: string, configData: ProjectConfigRequest): Observable<ProjectConfig> {
    return this.http.put<ProjectConfig>(`${this.baseUrl}/configs/${projectId}/`, configData);
  }

  // Project Members Management
  getProjectMembers(projectId: string, params?: PaginationParams): Observable<PaginatedProjectMemberList> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.role) {
      httpParams = httpParams.set('role', params.role);
    }

    return this.http.get<PaginatedProjectMemberList>(
        `${this.baseUrl}/projects/${projectId}/members/`,
        {params: httpParams},
    );
  }

  addProjectMember(projectId: string, memberData: ProjectMemberRequest): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(
        `${this.baseUrl}/projects/${projectId}/members/`,
        memberData,
    );
  }

  updateProjectMember(projectId: string, memberId: string, memberData: PatchedProjectMemberRequest): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(
        `${this.baseUrl}/projects/${projectId}/members/${memberId}/`,
        memberData,
    );
  }

  removeProjectMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/members/${memberId}/`);
  }
}
