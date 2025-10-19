import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Issue, PaginationParams } from '../models/interfaces';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedIssueList } from '../models/api-interfaces';


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
    }
    return this.http.get<PaginatedIssueList>(`${this.baseUrl}/?${query}`, { headers });
  }

  createIssue(issueData: Issue): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Issue>(`${this.baseUrl}/`, issueData, { headers });
  }

  getIssue(issueId: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Issue>(`${this.baseUrl}/${issueId}/`, { headers });
  }

  editIssue(issueId: string, issueData: Issue): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<Issue>(`${this.baseUrl}/${issueId}/`, issueData, { headers });
  }

  deleteIssue(issueId: string): Observable<Issue> {
    const token = localStorage.getItem('access');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<Issue>(`${this.baseUrl}/${issueId}/`, { headers });
  }
}
