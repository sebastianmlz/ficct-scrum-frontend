import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Workspace,
  WorkspaceRequest,
  WorkspaceMember,
  WorkspaceMemberRequest,
  PaginatedWorkspaceList,
  PaginatedWorkspaceMemberList,
  PaginationParams
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/workspaces`;

  getWorkspaces(params?: PaginationParams): Observable<PaginatedWorkspaceList> {
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
    if (params?.workspace_type) {
      httpParams = httpParams.set('workspace_type', params.workspace_type);
    }

    return this.http.get<PaginatedWorkspaceList>(`${this.baseUrl}/`, { params: httpParams });
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.baseUrl}/${id}/`);
  }

  createWorkspace(workspaceData: WorkspaceRequest): Observable<Workspace> {
    const formData = new FormData();
    
    formData.append('name', workspaceData.name);
    formData.append('slug', workspaceData.slug);
    
    if (workspaceData.description) {
      formData.append('description', workspaceData.description);
    }
    if (workspaceData.workspace_type) {
      formData.append('workspace_type', workspaceData.workspace_type);
    }
    if (workspaceData.visibility) {
      formData.append('visibility', workspaceData.visibility);
    }
    if (workspaceData.cover_image) {
      formData.append('cover_image', workspaceData.cover_image);
    }
    if (workspaceData.workspace_settings) {
      formData.append('workspace_settings', JSON.stringify(workspaceData.workspace_settings));
    }
    if (workspaceData.is_active !== undefined) {
      formData.append('is_active', workspaceData.is_active.toString());
    }

    return this.http.post<Workspace>(`${this.baseUrl}/`, formData);
  }

  updateWorkspace(id: string, workspaceData: Partial<WorkspaceRequest>): Observable<Workspace> {
    const formData = new FormData();
    
    if (workspaceData.name) {
      formData.append('name', workspaceData.name);
    }
    if (workspaceData.slug) {
      formData.append('slug', workspaceData.slug);
    }
    if (workspaceData.description) {
      formData.append('description', workspaceData.description);
    }
    if (workspaceData.workspace_type) {
      formData.append('workspace_type', workspaceData.workspace_type);
    }
    if (workspaceData.visibility) {
      formData.append('visibility', workspaceData.visibility);
    }
    if (workspaceData.cover_image) {
      formData.append('cover_image', workspaceData.cover_image);
    }
    if (workspaceData.workspace_settings) {
      formData.append('workspace_settings', JSON.stringify(workspaceData.workspace_settings));
    }
    if (workspaceData.is_active !== undefined) {
      formData.append('is_active', workspaceData.is_active.toString());
    }

    return this.http.patch<Workspace>(`${this.baseUrl}/${id}/`, formData);
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // Workspace Members
  getWorkspaceMembers(workspaceId: string, params?: PaginationParams): Observable<PaginatedWorkspaceMemberList> {
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

    return this.http.get<PaginatedWorkspaceMemberList>(`${this.baseUrl}/${workspaceId}/members/`, { params: httpParams });
  }

  addWorkspaceMember(workspaceId: string, memberData: WorkspaceMemberRequest): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.baseUrl}/${workspaceId}/members/`, memberData);
  }

  updateWorkspaceMember(workspaceId: string, memberId: string, memberData: Partial<WorkspaceMemberRequest>): Observable<WorkspaceMember> {
    return this.http.patch<WorkspaceMember>(`${this.baseUrl}/${workspaceId}/members/${memberId}/`, memberData);
  }

  removeWorkspaceMember(workspaceId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${workspaceId}/members/${memberId}/`);
  }
}
