import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SprintReport} from '../models/interfaces';
import {TeamMetricsResponse} from '../models/interfaces';
import {VelocityChartResponse} from '../models/interfaces';
import {CumulativeFlowResponse} from '../models/interfaces';
import {ExportRequest, ExportResponse} from '../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/reporting/reports`;

  /**
   * Obtiene el reporte de sprint por UUID
   * @param sprintId UUID del sprint
   */
  getSprintReport(sprintId: string): Observable<SprintReport> {
    const params = new HttpParams().set('sprint', sprintId);
    return this.http.get<SprintReport>(`${this.baseUrl}/sprint-report/`, {params});
  }

  /**
   * Obtiene las métricas de equipo para el proyecto
   * @param projectId UUID del proyecto
   * @param period Periodo en días (opcional)
   */
  getTeamMetrics(projectId: string, period?: number): Observable<TeamMetricsResponse> {
    let params = new HttpParams().set('project', projectId);
    if (period) {
      params = params.set('period', period.toString());
    }
    return this.http.get<TeamMetricsResponse>(`${this.baseUrl}/team-metrics/`, {params});
  }

  /**
   * Obtiene el velocity chart para el proyecto
   * @param projectId UUID del proyecto
   * @param numSprints Número de sprints a incluir (opcional)
   */
  getVelocityChart(projectId: string, numSprints?: number): Observable<VelocityChartResponse> {
    let params = new HttpParams().set('project', projectId);
    if (numSprints) {
      params = params.set('num_sprints', numSprints.toString());
    }
    return this.http.get<VelocityChartResponse>(`${this.baseUrl}/velocity/`, {params});
  }

  /**
   * Obtiene el cumulative flow diagram para el proyecto
   * @param projectId UUID del proyecto
   * @param days Número de días a incluir (opcional)
   */
  getCumulativeFlow(projectId: string, days?: number): Observable<CumulativeFlowResponse> {
    let params = new HttpParams().set('project', projectId);
    if (days) {
      params = params.set('days', days.toString());
    }
    return this.http.get<CumulativeFlowResponse>(`${this.baseUrl}/cumulative-flow/`, {params});
  }

  /**
   * Exporta datos del proyecto a CSV
   * @param exportData Datos de la exportación
   */
  exportData(exportData: ExportRequest): Observable<ExportResponse> {
    return this.http.post<ExportResponse>(`${this.baseUrl}/export/`, exportData);
  }
}
