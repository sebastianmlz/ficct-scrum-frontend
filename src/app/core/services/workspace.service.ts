import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Observable} from 'rxjs';

import {environment} from '../../../environments/environment';

export interface WorkspaceCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  workspace_type: string;
  visibility: string;
  cover_image?: string | File;
  workspace_settings?: any;
  is_active?: boolean;
  organization: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
}

export interface CreatedBy {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface Workspace {
  id: string;
  organization: Organization;
  name: string;
  slug: string;
  description?: string;
  workspace_type: string;
  visibility: string;
  cover_image?: string;
  cover_image_url?: string;
  workspace_settings?: any;
  is_active: boolean;
  created_by: CreatedBy;
  member_count: number;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workspace[];
}

export interface UserProfile {
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  timezone: string;
  language: string;
  github_username?: string;
  linkedin_url?: string;
  website_url?: string;
  is_online: boolean;
  last_activity: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string;
  created_at: string;
  updated_at: string;
  profile: UserProfile;
}

export interface WorkspaceMember {
  id: string;
  workspace: string;
  user: User;
  role: string;
  permissions?: any;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface WorkspaceMembersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkspaceMember[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private apiUrl = `${environment.apiUrl}/api/v1/workspaces`;

  private http = inject(HttpClient);

  createWorkspace(workspace: WorkspaceCreateRequest | FormData)
  : Observable<Workspace> {
    const token = localStorage.getItem('access');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Si es FormData (con archivo), no establecer Content-Type
    // Si es JSON (sin archivo), Angular establecerá application/json
    if (workspace instanceof FormData) {
      headers = headers.delete('Content-Type');
    }

    return this.http.post<Workspace>(`${this.apiUrl}/`, workspace, {headers});
  }

  getWorkspaces(organizationId?: string, page?: number, search?: string)
  : Observable<WorkspaceListResponse> {
    let params = '';
    const queryParams = [];

    if (organizationId) queryParams.push(`organization=${organizationId}`);
    if (page) queryParams.push(`page=${page}`);
    if (search) queryParams.push(`search=${search}`);

    if (queryParams.length > 0) {
      params = '?' + queryParams.join('&');
    }

    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<WorkspaceListResponse>(`${
      this.apiUrl}/${params}`, {headers});
  }

  getWorkspace(id: string): Observable<Workspace> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Workspace>(`${this.apiUrl}/${id}/`, {headers});
  }

  updateWorkspace(id: string, workspace: Partial<WorkspaceCreateRequest>)
  : Observable<Workspace> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<Workspace>(`${this.apiUrl}/${id}/`,
        workspace, {headers});
  }

  deleteWorkspace(id: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}/`, {headers});
  }

  getWorkspaceMembers(workspaceId: string)
  : Observable<WorkspaceMembersResponse> {
    /* let params = '';
    const queryParams = [`workspace=${workspaceId}`];

    if (page) queryParams.push(`page=${page}`);
    if (search) queryParams.push(`search=${search}`);
    if (ordering) queryParams.push(`ordering=${ordering}`);

    params = '?' + queryParams.join('&');*/

    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<WorkspaceMembersResponse>(`${
      this.apiUrl}/${workspaceId}/members/`, {headers});
  }

  getWorkspaceMember(memberId: string): Observable<WorkspaceMember> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<WorkspaceMember>(`${
      this.apiUrl}/members/${memberId}/`, {headers});
  }

  updateWorkspaceMember(memberId: string, data: { role: string })
  : Observable<WorkspaceMember> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    return this.http.patch<WorkspaceMember>(`${
      this.apiUrl}/members/${memberId}/update-role/`, data, {headers});
  }

  deleteWorkspaceMember(memberRelationId: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${
      this.apiUrl}/members/${memberRelationId}/`, {headers});
  }

  // Method to add a member to a workspace
  addWorkspaceMember(data: { workspace: string, user_id: number, role: string,
    permissions?: any, is_active?: boolean }): Observable<WorkspaceMember> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    return this.http.post<WorkspaceMember>(`${
      this.apiUrl}/members/`, data, {headers});
  }
}
