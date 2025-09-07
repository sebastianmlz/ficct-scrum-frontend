import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { 
  Organization, 
  PaginatedOrganizationList, 
  ApiQueryParams 
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/orgs`;

  getOrganizations(params?: ApiQueryParams): Observable<PaginatedOrganizationList> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ApiQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<PaginatedOrganizationList>(`${this.baseUrl}/organizations/`, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.baseUrl}/organizations/${id}/`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createOrganization(organization: Partial<Organization>): Observable<Organization> {
    return this.http.post<Organization>(`${this.baseUrl}/organizations/`, organization).pipe(
      catchError(this.handleError)
    );
  }

  updateOrganization(id: string, organization: Partial<Organization>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.baseUrl}/organizations/${id}/`, organization).pipe(
      catchError(this.handleError)
    );
  }

  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('OrganizationsService error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
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
          errorMessage = 'Organization not found.';
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
