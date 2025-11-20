import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {
  Workspace,
  WorkspaceRequest,
  PaginatedWorkspaceList,
  WorkspaceMember,
  WorkspaceMemberRequest,
  PaginatedWorkspaceMemberList,
  ApiQueryParams,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WorkspacesService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/workspaces`;

  // ==================== WORKSPACE CRUD ====================

  getWorkspaces(params?: ApiQueryParams): Observable<PaginatedWorkspaceList> {
    console.log('[WORKSPACE-SERVICE] 🔵 getWorkspaces() called with params:', params);

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ApiQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/`;
    console.log('[WORKSPACE-SERVICE] 🌐 HTTP GET URL:', url);
    console.log('[WORKSPACE-SERVICE] 📋 HTTP Params:', httpParams.toString());

    return this.http.get<PaginatedWorkspaceList>(url, {params: httpParams}).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.baseUrl}/${id}/`).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  createWorkspace(workspace: WorkspaceRequest | FormData): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.baseUrl}/`, workspace).pipe(
        catchError(this.handleError),
    );
  }

  updateWorkspace(id: string, workspace: Partial<WorkspaceRequest> | FormData): Observable<Workspace> {
    return this.http.patch<Workspace>(`${this.baseUrl}/${id}/`, workspace).pipe(
        catchError(this.handleError),
    );
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`).pipe(
        catchError(this.handleError),
    );
  }

  uploadCoverImage(id: string, file: File): Observable<Workspace> {
    const formData = new FormData();
    formData.append('cover_image', file);

    return this.http.post<Workspace>(`${this.baseUrl}/${id}/upload-cover/`, formData).pipe(
        catchError(this.handleError),
    );
  }

  // ==================== WORKSPACE MEMBERS ====================

  getWorkspaceMembers(workspaceId: string, params?: ApiQueryParams): Observable<PaginatedWorkspaceMemberList> {
    let httpParams = new HttpParams();

    if (workspaceId) {
      httpParams = httpParams.set('workspace', workspaceId);
    }

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ApiQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedWorkspaceMemberList>(`${this.baseUrl}/members/`, {params: httpParams}).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  getWorkspaceMember(memberId: string): Observable<WorkspaceMember> {
    return this.http.get<WorkspaceMember>(`${this.baseUrl}/members/${memberId}/`).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  addWorkspaceMember(data: WorkspaceMemberRequest): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.baseUrl}/members/`, data).pipe(
        catchError(this.handleError),
    );
  }

  updateWorkspaceMemberRole(memberId: string, role: string): Observable<WorkspaceMember> {
    return this.http.patch<WorkspaceMember>(
        `${this.baseUrl}/members/${memberId}/update-role/`,
        {role},
    ).pipe(
        catchError(this.handleError),
    );
  }

  removeWorkspaceMember(memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/members/${memberId}/`).pipe(
        catchError(this.handleError),
    );
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('[WorkspacesService] Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'You are not authorized. Please log in.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission.';
            break;
          case 404:
            errorMessage = 'Workspace not found.';
            break;
          case 409:
            errorMessage = 'A workspace with this name or slug already exists.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
