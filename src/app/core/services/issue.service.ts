import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Issue, PaginationParams, IssueRequest, IssueComment,
  PaginatedIssueCommentList, IssueLink, IssueLinkDetail, IssueLinkRequest,
  PaginatedIssueLinkList} from '../models/interfaces';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {PaginatedIssueList} from '../models/api-interfaces';
import {PaginatedIssueTypeList} from '../models/api-interfaces';
import {AiService} from './ai.service';

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private http = inject(HttpClient);
  private aiService = inject(AiService);

  private baseUrl = `${environment.apiUrl}/api/v1/projects/issues`;

  getIssues(params?: PaginationParams): Observable<PaginatedIssueList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = ``;
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
      if (params.status_name) query += `&status_name=${params.status_name}`;
      if (params.priority) query += `&priority=${params.priority}`;
      if (params.assignee_email) {
        query += `&assignee_email=${params.assignee_email}`;
      }
      if (params.issue_type_category) {
        query += `&issue_type_category=${params.issue_type_category}`;
      }
      if (params.sprint) query += `&sprint=${params.sprint}`;
      if (params.project) query += `&project=${params.project}`;
      if (params.project_key) query += `&project_key=${params.project_key}`;
      if (params.workspace_key) {
        query += `&workspace_key=${params.workspace_key}`;
      }
    }
    return this.http.get<PaginatedIssueList>(`${
      this.baseUrl}?${query}`, {headers});
  }

  getIssueTypes(projectId?: string): Observable<PaginatedIssueTypeList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Construir URL con filtro de proyecto si se proporciona
    let url = `${environment.apiUrl}/api/v1/projects/issue-types/`;
    if (projectId) {
      url += `?project=${projectId}`;
      console.log('[ISSUE SERVICE] Fetching issue types for project:',
          projectId);
    } else {
      console.warn(
          '[ISSUE SERVICE] ⚠️ Fetching ALL issue types (no project filter)');
    }

    return this.http.get<PaginatedIssueTypeList>(url, {headers});
  }

  createIssue(issueData: IssueRequest): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<Issue>(`${this.baseUrl}/`, issueData, {headers}).pipe(
        tap(() => {
        // Invalidate project summary cache when new issue created
          if (issueData.project) {
            this.aiService.invalidateProjectCache(issueData.project);
            console.log('[ISSUE SERVICE] 🔄 Invalidated project cache' +
              ' after issue creation');
          }
        }),
    );
  }

  getIssue(issueId: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Issue>(`${this.baseUrl}/${issueId}/`, {headers});
  }

  editIssue(issueId: string, issueData: Partial<IssueRequest>)
  : Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.patch<Issue>(`${
      this.baseUrl}/${issueId}/`, issueData, {headers}).pipe(
        tap((updatedIssue) => {
        // Invalidate project cache if status changed (affects completion rate)
        // or if story points/estimated hours changed (affects metrics)
          const affectsMetrics = issueData.status ||
                               issueData.story_points !== undefined ||
                               issueData.estimated_hours !== undefined;

          if (affectsMetrics && updatedIssue.project?.id) {
            this.aiService.invalidateProjectCache(updatedIssue.project.id);
            console.log('[ISSUE SERVICE] 🔄 Invalidated project ' +
              'cache after issue update');
          }
        }),
    );
  }

  /**
   * Delete an issue and optionally invalidate project cache
   * @param issueId - UUID of the issue to delete
   * @param projectId - Optional project ID to invalidate cache
   */
  deleteIssue(issueId: string, projectId?: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete<void>(`${
      this.baseUrl}/${issueId}/`, {headers}).pipe(
        tap(() => {
        // Invalidate project cache if projectId provided
          if (projectId) {
            this.aiService.invalidateProjectCache(projectId);
            console.log('[ISSUE SERVICE] 🔄 Invalidated project ' +
              'cache after issue deletion');
          }
        }),
    );
  }

  /**
   * Asigna o reasigna una issue automáticamente (sin especificar usuario).
   * @param issueId UUID de la issue
   */
  assignIssue(issueId: string, assigneeId: number | null): Observable<any> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    // No se envía body, solo PATCH vacío
    if (assigneeId === null) {
      return this.http.patch<any>(`${this.baseUrl}/${
        issueId}/assign/`, {}, {headers});
    }
    return this.http.patch<any>(`${this.baseUrl}/${
      issueId}/assign/`, {assignee: assigneeId}, {headers});
  }

  updateIssuePriority(issueId: string, priority: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${
      issueId}/priority/`, {priority}, {headers});
  }

  updateIssueTransition(issueId: string, transition: string | null)
  : Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${
      issueId}/transition/`, {transition}, {headers});
  }

  createIssueComment(issueId: string, content: string)
  : Observable<IssueComment> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<IssueComment>(`${
      this.baseUrl}/${issueId}/comments/`, {content}, {headers});
  }

  getIssueComments(issueId: string, params?: PaginationParams)
  : Observable<PaginatedIssueCommentList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = '';
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
    }
    return this.http.get<PaginatedIssueCommentList>(`${
      this.baseUrl}/${issueId}/comments/?${query}`, {headers});
  }

  updateIssueComment(issueId: string, commentId: string, content: string)
  : Observable<IssueComment> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<IssueComment>(`${
      this.baseUrl}/${issueId}/comments/${commentId}/`, {content}, {headers});
  }

  deleteIssueComment(issueId: string, commentId: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${
      this.baseUrl}/${issueId}/comments/${commentId}/`, {headers});
  }

  /* Issues Links*/

  // Crear link entre issues
  createIssueLink(issueId: string, linkData: IssueLinkRequest)
  : Observable<IssueLink> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<IssueLink>(`${
      this.baseUrl}/${issueId}/links/`, linkData, {headers});
  }

  // Obtener todos los links de una issue
  getIssueLinks(issueId: string, params?: PaginationParams)
  : Observable<PaginatedIssueLinkList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = '';
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
    }
    return this.http.get<PaginatedIssueLinkList>(`${
      this.baseUrl}/${issueId}/links/?${query}`, {headers});
  }

  // Obtener detalle de un link específico
  getIssueLinkDetail(issueId: string, linkId: string)
  : Observable<IssueLinkDetail> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<IssueLinkDetail>(`${
      this.baseUrl}/${issueId}/links/${linkId}/`, {headers});
  }

  // Eliminar link entre issues
  deleteIssueLink(issueId: string, linkId: string): Observable<void> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${
      this.baseUrl}/${issueId}/links/${linkId}/`, {headers});
  }
}
