import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { 
  Workspace, 
  PaginatedWorkspaceList, 
  ApiQueryParams 
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspacesService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/workspaces`;

  getWorkspaces(params?: ApiQueryParams): Observable<PaginatedWorkspaceList> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ApiQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<PaginatedWorkspaceList>(`${this.baseUrl}/`, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.baseUrl}/${id}/`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createWorkspace(workspace: Partial<Workspace>): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.baseUrl}/`, workspace).pipe(
      catchError(this.handleError)
    );
  }

  updateWorkspace(id: string, workspace: Partial<Workspace>): Observable<Workspace> {
    return this.http.patch<Workspace>(`${this.baseUrl}/${id}/`, workspace).pipe(
      catchError(this.handleError)
    );
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('WorkspacesService error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'You are not authorized to access this resource.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Workspace not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
