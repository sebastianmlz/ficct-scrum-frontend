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
}
