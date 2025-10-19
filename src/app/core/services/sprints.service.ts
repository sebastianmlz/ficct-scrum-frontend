import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedSprintList } from '../models/api-interfaces';
import { SprintRequest, Sprint } from '../models/interfaces';
import { PaginationParams } from '../models/interfaces';


@Injectable({
  providedIn: 'root'
})
export class SprintsService {
  private baseUrl = `${environment.apiUrl}/api/v1/projects/sprints`;

  constructor(private http: HttpClient) { }

  getSprints(projectId: string, params?: PaginationParams): Observable<PaginatedSprintList> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let query = `?project=${projectId}`;
    if (params) {
      if (params.page) query += `&page=${params.page}`;
      if (params.ordering) query += `&ordering=${params.ordering}`;
      if (params.search) query += `&search=${params.search}`;
      if (params.status) query += `&status=${params.status}`;
    }
    return this.http.get<PaginatedSprintList>(`${this.baseUrl}/${query}`, { headers });
  }

  createSprints(sprintData: SprintRequest): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Sprint>(`${this.baseUrl}/`, sprintData, { headers });
  }

  getSprint(sprintId: string): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Sprint>(`${this.baseUrl}/${sprintId}/`, { headers });
  }

  editSprint(sprintId: string, sprintData: SprintRequest): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Sprint>(`${this.baseUrl}/${sprintId}/`, sprintData, { headers })
  }

  deleteSprint(sprintId: string): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<Sprint>(`${this.baseUrl}/${sprintId}/`, { headers })
  }

  getSprintBurdown(sprintId: string): Observable<any> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.baseUrl}/${sprintId}/burndown/`, { headers });
  }

  starSprint(sprintId: string): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Sprint>(`${this.baseUrl}/${sprintId}/start/`, {}, { headers });
  }

  getSprintProgress(sprintId: string): Observable<any> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.baseUrl}/${sprintId}/progress/`, { headers });
  }

  completeSprint(sprintId: string): Observable<Sprint> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Sprint>(`${this.baseUrl}/${sprintId}/complete/`, {}, { headers });
  }
}
