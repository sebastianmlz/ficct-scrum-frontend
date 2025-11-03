import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ML Request Interfaces
export interface PredictEffortRequest {
  title: string;
  description?: string;
  issue_type?: string;
  project_id: string;
}

export interface EstimateSprintDurationRequest {
  sprint_id: string;
  scope_change_percentage?: number;
  team_capacity_hours?: number;
}

export interface RecommendStoryPointsRequest {
  title?: string;
  description?: string;
  issue_type?: string;
  project_id?: string;
}

export interface SuggestAssignmentRequest {
  issue_id?: string;
  project_id?: string;
}

// ML Response Interfaces
export interface PredictEffortResponse {
  predicted_hours: number;
  confidence: number;
  prediction_range: {
    min: number;
    max: number;
  };
  method: string;
  reasoning: string;
  similar_issues: any[];
}

export interface EstimateSprintDurationResponse {
  estimated_days: number;
  planned_days?: number;
  confidence: number;
  total_estimated_hours?: number;
  hours_per_day?: number;
  average_velocity?: number;
  total_story_points?: number;
  risk_factors: string[];
  method: string; // 'from_sprint_dates' | 'from_estimated_hours' | 'historical_velocity' | 'default'
  error?: string;
}

export interface RecommendStoryPointsResponse {
  recommended_points: number;
  confidence: number;
  similar_issues_count: number;
}

export interface SuggestAssignmentResponse {
  suggested_assignee: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    current_workload: number;
    relevant_skills: string[];
  };
  reasoning: string;
}

export interface SprintRisk {
  risk_type: string;
  severity: string; // 'low' | 'medium' | 'high'
  description: string;
  mitigation_suggestions?: string[];
  // Campos específicos según el tipo de riesgo
  unassigned_count?: number;
  total_count?: number;
  estimated_hours?: number;
  actual_hours?: number;
  drift_percentage?: number;
  stalled_count?: number;
  stalled_days?: number;
  high_priority_count?: number;
  unestimated_count?: number;
  scope_change_count?: number;
  capacity_ratio?: number;
  issues_per_member?: number;
}

export interface SprintRiskResponse {
  risks: SprintRisk[];
}

export interface ProjectAnomaly {
  anomaly_type: string;
  severity: string;
  description: string;
  detected_at: string;
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/ml`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Predicts effort (hours/story points) required for an issue
   */
  predictEffort(request: PredictEffortRequest): Observable<PredictEffortResponse> {
    return this.http.post<PredictEffortResponse>(
      `${this.baseUrl}/predict-effort/`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Estimates actual sprint completion time
   */
  estimateSprintDuration(request: EstimateSprintDurationRequest): Observable<EstimateSprintDurationResponse> {
    return this.http.post<EstimateSprintDurationResponse>(
      `${this.baseUrl}/estimate-sprint-duration/`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Recommends story points for an issue
   */
  recommendStoryPoints(request: RecommendStoryPointsRequest): Observable<RecommendStoryPointsResponse> {
    return this.http.post<RecommendStoryPointsResponse>(
      `${this.baseUrl}/recommend-story-points/`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Suggests team member for issue assignment
   */
  suggestAssignment(request: SuggestAssignmentRequest): Observable<SuggestAssignmentResponse> {
    return this.http.post<SuggestAssignmentResponse>(
      `${this.baseUrl}/suggest-assignment/`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets sprint risk assessment
   */
  getSprintRisk(sprintId: string): Observable<SprintRiskResponse> {
    return this.http.get<SprintRiskResponse>(
      `${this.baseUrl}/${sprintId}/sprint-risk/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets project anomalies detection
   */
  getProjectAnomalies(projectId: string): Observable<ProjectAnomaly[]> {
    return this.http.get<ProjectAnomaly[]>(
      `${this.baseUrl}/project-anomalies/${projectId}/`,
      { headers: this.getHeaders() }
    );
  }
}
