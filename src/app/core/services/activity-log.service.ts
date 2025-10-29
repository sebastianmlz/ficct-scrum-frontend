import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLogUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
}

export interface ActivityLogOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface ActivityLogWorkspace {
  id: string;
  name: string;
  key: string;
}

export interface ActivityLogProject {
  id: string;
  name: string;
  key: string;
}

export interface ActivityLog {
  id: string;
  user_detail: ActivityLogUser;
  organization_detail?: ActivityLogOrganization;
  workspace_detail?: ActivityLogWorkspace;
  project_detail?: ActivityLogProject;
  action_type: string;
  action_display: string;
  formatted_action: string;
  object_repr: string;
  object_type: string;
  object_url: string;
  object_id: string;
  changes?: Record<string, { old: any; new: any }>;
  time_ago: string;
  created_at: string;
}

export interface PaginatedActivityLogList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityLog[];
}

export interface ActivityLogParams {
  // Scope filters
  organization?: string;
  workspace?: string;
  workspace_key?: string;
  project?: string;
  project_key?: string;
  
  // Action filters
  action_type?: string;
  object_type?: string;
  
  // User filters
  user?: string;
  user_email?: string;
  
  // Date filters
  created_after?: string;
  created_before?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/reporting/activity`;

  getActivityLogs(params?: ActivityLogParams): Observable<PaginatedActivityLogList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    let query = '';
    if (params) {
      // Scope filters
      if (params.organization) query += `&organization=${params.organization}`;
      if (params.workspace) query += `&workspace=${params.workspace}`;
      if (params.workspace_key) query += `&workspace_key=${params.workspace_key}`;
      if (params.project) query += `&project=${params.project}`;
      if (params.project_key) query += `&project_key=${params.project_key}`;
      
      // Action filters
      if (params.action_type) query += `&action_type=${params.action_type}`;
      if (params.object_type) query += `&object_type=${params.object_type}`;
      
      // User filters
      if (params.user) query += `&user=${params.user}`;
      if (params.user_email) query += `&user_email=${params.user_email}`;
      
      // Date filters
      if (params.created_after) query += `&created_after=${params.created_after}`;
      if (params.created_before) query += `&created_before=${params.created_before}`;
      
      // Pagination
      if (params.page) query += `&page=${params.page}`;
      if (params.limit) query += `&limit=${params.limit}`;
      if (params.offset) query += `&offset=${params.offset}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
    }
    
    return this.http.get<PaginatedActivityLogList>(`${this.baseUrl}?${query}`, { headers });
  }
}
