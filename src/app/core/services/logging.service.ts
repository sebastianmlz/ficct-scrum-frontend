import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  SystemLog,
  ErrorLog,
  PaginatedSystemLogList,
  PaginatedErrorLogList,
  SystemLogQueryParams,
  ErrorLogQueryParams,
} from '../models/interfaces';
// import { environment } from '../../../environments/environment';
import {environment} from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/logs`;

  getSystemLogs(params?: SystemLogQueryParams): Observable<PaginatedSystemLogList> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.action_type) {
      httpParams = httpParams.set('action_type', params.action_type);
    }
    if (params?.ip_address) {
      httpParams = httpParams.set('ip_address', params.ip_address);
    }
    if (params?.level) {
      httpParams = httpParams.set('level', params.level);
    }
    if (params?.user) {
      httpParams = httpParams.set('user', params.user.toString());
    }

    return this.http.get<PaginatedSystemLogList>(`${this.baseUrl}/system-logs/`, {params: httpParams});
  }

  getSystemLog(id: string): Observable<SystemLog> {
    return this.http.get<SystemLog>(`${this.baseUrl}/system-logs/${id}/`);
  }

  getErrorLogs(params?: ErrorLogQueryParams): Observable<PaginatedErrorLogList> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.error_type) {
      httpParams = httpParams.set('error_type', params.error_type);
    }
    if (params?.severity) {
      httpParams = httpParams.set('severity', params.severity);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<PaginatedErrorLogList>(`${this.baseUrl}/error-logs/`, {params: httpParams});
  }

  getErrorLog(id: string): Observable<ErrorLog> {
    return this.http.get<ErrorLog>(`${this.baseUrl}/error-logs/${id}/`);
  }

  updateErrorLogStatus(id: string, status: string, notes?: string): Observable<ErrorLog> {
    const data: any = {status};
    if (notes) {
      data.notes = notes;
    }

    return this.http.patch<ErrorLog>(`${this.baseUrl}/error-logs/${id}/`, data);
  }
}
