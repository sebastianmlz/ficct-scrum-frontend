import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Issue, PaginationParams, IssueRequest, IssueType, IssueComment, IssueCommentRequest, PaginatedIssueCommentList } from '../models/interfaces';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedIssueList } from '../models/api-interfaces';
import { PaginatedIssueTypeList } from '../models/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class IssueService {

  constructor(private http: HttpClient) { }
  private baseUrl = `${environment.apiUrl}/api/v1/projects/issues`;

  getIssues(params?: PaginationParams): Observable<PaginatedIssueList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = ``;
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
      if (params.status) query += `&status=${params.status}`;
      if (params.sprint) query += `&sprint=${params.sprint}`;
      if (params.project) query += `&project=${params.project}`;
    }
    return this.http.get<PaginatedIssueList>(`${this.baseUrl}?${query}`, { headers });
  }

  getIssueTypes(projectId?: string): Observable<PaginatedIssueTypeList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Construir URL con filtro de proyecto si se proporciona
    let url = `${environment.apiUrl}/api/v1/projects/issue-types/`;
    if (projectId) {
      url += `?project=${projectId}`;
      console.log('[ISSUE SERVICE] Fetching issue types for project:', projectId);
    } else {
      console.warn('[ISSUE SERVICE] ⚠️ Fetching ALL issue types (no project filter)');
    }

    return this.http.get<PaginatedIssueTypeList>(url, { headers });
  }

  createIssue(issueData: IssueRequest): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Issue>(`${this.baseUrl}/`, issueData, { headers });
  }

  getIssue(issueId: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Issue>(`${this.baseUrl}/${issueId}/`, { headers });
  }

  editIssue(issueId: string, issueData: Partial<IssueRequest>): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${issueId}/`, issueData, { headers });
  }

  deleteIssue(issueId: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${this.baseUrl}/${issueId}/`, { headers });
  }

  /**
   * Asigna o reasigna una issue automáticamente (sin especificar usuario).
   * @param issueId UUID de la issue
   */
  assignIssue(issueId: string): Observable<any> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    // No se envía body, solo PATCH vacío
    return this.http.patch<any>(`${this.baseUrl}/${issueId}/assign/`, {}, { headers });
  }

  updateIssuePriority(issueId: string, priority: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${issueId}/priority/`, { priority }, { headers });
  }

  updateIssueTransition(issueId: string, transition: string | null): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${issueId}/transition/`, { transition }, { headers });
  }

  createIssueComment(issueId: string, content: string): Observable<IssueComment> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<IssueComment>(`${this.baseUrl}/${issueId}/comments/`, { content }, { headers });
  }

  getIssueComments(issueId: string, params?: PaginationParams): Observable<PaginatedIssueCommentList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = '';
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
    }
    return this.http.get<PaginatedIssueCommentList>(`${this.baseUrl}/${issueId}/comments/?${query}`, { headers });
  }

  updateIssueComment(issueId: string, commentId: string, content: string): Observable<IssueComment> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<IssueComment>(`${this.baseUrl}/${issueId}/comments/${commentId}/`, { content }, { headers });
  }

  deleteIssueComment(issueId: string, commentId: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${this.baseUrl}/${issueId}/comments/${commentId}/`, { headers });
  }
}
