import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {AiCacheService} from './ai-cache.service';

// ML Request Interfaces
export interface PredictEffortRequest {
  title: string;
  description?: string;
  issue_type: string;
  project_id: string;
}

export interface EstimateSprintDurationRequest {
  sprint_id: string;
  scope_change_percentage?: number;
  team_capacity_hours?: number;
}

export interface RecommendStoryPointsRequest {
  title: string;
  description?: string;
  issue_type: string;
  project_id: string;
}

export interface SuggestAssignmentRequest {
  issue_id: string;
  project_id: string;
  top_n?: number; // Number of suggestions to return (default 3)
}

// ML Response Interfaces
export interface PredictEffortResponse {
  predicted_hours: number;
  confidence: number; // 0.0-1.0
  prediction_range: {
    min: number;
    max: number;
  };
  method: 'ml_model' | 'similarity' | 'heuristic';
  model_version?: string; // Present if method is ml_model
  reasoning: string;
  similar_issues?: any[]; // Present if method is similarity
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
  recommended_points: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21
  confidence: number; // 0.0-1.0
  probability_distribution?: Record<string, number>; // e.g., {"3": 0.2, "5": 0.5, "8": 0.3}
  reasoning: string;
  method: string;
  similar_issues_count?: number;
}

export interface AssignmentSuggestion {
  user_id: string;
  username: string;
  user_email: string;
  total_score: number; // 0.0-1.0
  skill_score: number; // 0.0-1.0
  workload_score: number; // 0.0-1.0
  performance_score: number; // 0.0-1.0
  availability_score: number; // 0.0-1.0
  reasoning: string[]; // Array of human-readable reasons
}

export interface SuggestAssignmentResponse {
  suggestions: AssignmentSuggestion[];
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

export interface ProjectSummaryResponse {
  completion: number; // 0-100 percentage
  velocity: number; // Average velocity
  risk_score: number; // 0-100 (higher = more risk)
  project_id: string;
  generated_at: string; // ISO 8601
  metrics_breakdown: {
    total_issues: number;
    completed_issues: number;
    sprints_analyzed: number;
    unassigned_issues: number;
    overdue_issues: number;
  };
}

export interface ProjectAnomaly {
  anomaly_type: string;
  severity: string;
  description: string;
  detected_at: string;
  recommendation: string;
}

@Injectable({
  providedIn: 'root',
})
export class MlService {
  private http = inject(HttpClient);
  private cache = inject(AiCacheService);
  private baseUrl = `${environment.apiUrl}/api/v1/ml`;

  // Cache TTL constants
  private readonly EFFORT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly POINTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly ASSIGNMENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SUMMARY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RISK_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Predicts effort (hours) required for an issue
   * Caches results for 5 minutes based on request parameters
   */
  predictEffort(request: PredictEffortRequest): Observable<PredictEffortResponse> {
    const cacheKey = `effort_${request.project_id}_${request.title}_${request.issue_type}`;
    const cached = this.cache.get<PredictEffortResponse>(cacheKey);

    if (cached) {
      console.log('[ML Service] Returning cached effort prediction');
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    console.log('[ML Service] Fetching effort prediction from API');
    return this.http.post<PredictEffortResponse>(
        `${this.baseUrl}/predict-effort/`,
        request,
    ).pipe(
        tap((response) => this.cache.set(cacheKey, response, this.EFFORT_CACHE_TTL)),
    );
  }

  /**
   * Estimates actual sprint completion time
   */
  estimateSprintDuration(request: EstimateSprintDurationRequest): Observable<EstimateSprintDurationResponse> {
    console.log('[ML Service] Estimating sprint duration');
    return this.http.post<EstimateSprintDurationResponse>(
        `${this.baseUrl}/estimate-sprint-duration/`,
        request,
    );
  }

  /**
   * Recommends story points for an issue
   * Caches results for 5 minutes based on request parameters
   */
  recommendStoryPoints(request: RecommendStoryPointsRequest): Observable<RecommendStoryPointsResponse> {
    const cacheKey = `points_${request.project_id}_${request.title}_${request.issue_type}`;
    const cached = this.cache.get<RecommendStoryPointsResponse>(cacheKey);

    if (cached) {
      console.log('[ML Service] Returning cached story points recommendation');
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    console.log('[ML Service] Fetching story points recommendation from API');
    return this.http.post<RecommendStoryPointsResponse>(
        `${this.baseUrl}/recommend-story-points/`,
        request,
    ).pipe(
        tap((response) => this.cache.set(cacheKey, response, this.POINTS_CACHE_TTL)),
    );
  }

  /**
   * Suggests team members for issue assignment
   * Returns top N suggestions ranked by score
   * Caches results for 5 minutes
   */
  suggestAssignment(request: SuggestAssignmentRequest): Observable<SuggestAssignmentResponse> {
    const cacheKey = `assignment_${request.project_id}_${request.issue_id}`;
    const cached = this.cache.get<SuggestAssignmentResponse>(cacheKey);

    if (cached) {
      console.log('[ML Service] Returning cached assignment suggestions');
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    console.log('[ML Service] Fetching assignment suggestions from API');
    return this.http.post<SuggestAssignmentResponse>(
        `${this.baseUrl}/suggest-assignment/`,
        request,
    ).pipe(
        tap((response) => this.cache.set(cacheKey, response, this.ASSIGNMENT_CACHE_TTL)),
    );
  }

  /**
   * Gets sprint risk assessment
   * Caches results for 15 minutes
   */
  getSprintRisk(sprintId: string): Observable<SprintRiskResponse> {
    const cacheKey = `sprint_risk_${sprintId}`;
    const cached = this.cache.get<SprintRiskResponse>(cacheKey);

    if (cached) {
      console.log('[ML Service] Returning cached sprint risks');
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    console.log('[ML Service] Fetching sprint risks from API');
    return this.http.get<SprintRiskResponse>(
        `${this.baseUrl}/${sprintId}/sprint-risk/`,
    ).pipe(
        tap((response) => this.cache.set(cacheKey, response, this.RISK_CACHE_TTL)),
    );
  }

  /**
   * Gets AI-powered project summary with health metrics
   * Caches results for 5 minutes
   */
  getProjectSummary(projectId: string): Observable<ProjectSummaryResponse> {
    const cacheKey = `project_summary_${projectId}`;
    const cached = this.cache.get<ProjectSummaryResponse>(cacheKey);

    if (cached) {
      console.log('[ML Service] Returning cached project summary');
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    console.log('[ML Service] Fetching project summary from API');
    return this.http.post<ProjectSummaryResponse>(
        `${this.baseUrl}/${projectId}/project-summary/`,
        {},
    ).pipe(
        tap((response) => this.cache.set(cacheKey, response, this.SUMMARY_CACHE_TTL)),
    );
  }

  /**
   * Clears ML cache for a specific project
   * Call this when project data changes significantly
   */
  clearProjectCache(projectId: string): void {
    this.cache.invalidatePattern(`effort_${projectId}`);
    this.cache.invalidatePattern(`points_${projectId}`);
    this.cache.invalidatePattern(`assignment_${projectId}`);
    this.cache.invalidatePattern(`project_summary_${projectId}`);
    console.log('[ML Service] Cleared cache for project:', projectId);
  }

  /**
   * Clears cache for a specific sprint
   */
  clearSprintCache(sprintId: string): void {
    this.cache.invalidate(`sprint_risk_${sprintId}`);
    console.log('[ML Service] Cleared cache for sprint:', sprintId);
  }
}
