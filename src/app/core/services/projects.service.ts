import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {
  Project,
  PaginatedProjectList,
  ApiQueryParams,
  ProjectConfigRequest,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/projects`;

  getProjects(params?: ApiQueryParams): Observable<PaginatedProjectList> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ApiQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedProjectList>(`${this.baseUrl}/projects/`, {params: httpParams}).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}/`).pipe(
        retry(1),
        catchError(this.handleError),
    );
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/`, project).pipe(
        catchError(this.handleError),
    );
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/projects/${id}/`, project).pipe(
        catchError(this.handleError),
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}/`).pipe(
        catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProjectsService error:', error);

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
          errorMessage = 'Project not found.';
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

  createProjectConfig(config: ProjectConfigRequest): Observable<ProjectConfigRequest> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<ProjectConfigRequest>(`${this.baseUrl}/configs/`, config, {headers}).pipe(
        catchError(this.handleError),
    );
  }

  getProjectConfig(): Observable<ProjectConfigRequest> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ProjectConfigRequest>(`${this.baseUrl}/projects/configs/`, {headers}).pipe(
        catchError(this.handleError),
    );
  }

  editProjectConfig(id: string, config: Partial<ProjectConfigRequest>): Observable<ProjectConfigRequest> {
    return this.http.patch<ProjectConfigRequest>(`${this.baseUrl}/projects/configs/${id}/`, config).pipe(
        catchError(this.handleError),
    );
  }
}
