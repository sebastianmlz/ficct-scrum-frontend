import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces para las respuestas de los endpoints AI
export interface AIChatRequest {
  question: string;
  project_id: string;
  conversation_id?: string;
}

export interface AIChatResponse {
  response: string;
  conversation_id: string;
  sources: string[];
  suggested_actions?: string[];
}

export interface SemanticSearchRequest {
  query: string;
  project_id: string;
  limit?: number;
}

export interface SearchResult {
  issue: {
    id: string;
    title: string;
    key: string;
  };
  similarity_score: number;
  matched_content: string;
}

export interface SemanticSearchResponse {
  results: SearchResult[];
}

export interface SimilarIssue {
  id: string;
  title: string;
  key: string;
  similarity_score: number;
}

export interface FindSimilarResponse {
  similar_issues: SimilarIssue[];
}

export interface IssueSummaryResponse {
  summary: string;
  key_points: string[];
  estimated_complexity: string;
}

export interface SprintSummaryResponse {
  summary: string;
  sprint_metrics: {
    total_issues: number;
    completed: number;
    completion_rate: number;
  };
}

export interface ProjectReportRequest {
  project_id: string;
  include_sprints?: boolean;
  include_issues?: boolean;
}

export interface ProjectReportResponse {
  report: string;
  metrics: {
    completion_rate: number;
    velocity: number;
    risk_score: number;
  };
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/ai`;

  /**
   * AI Chat - Natural language chat interface
   */
  chat(request: AIChatRequest): Observable<AIChatResponse> {
    // El backend espera 'Question' en vez de 'message'
    return this.http.post<AIChatResponse>(`${this.apiUrl}/query/`, request);
  }

  /**
   * Semantic Search Issues - Search issues using natural language
   */
  searchIssues(request: SemanticSearchRequest): Observable<SemanticSearchResponse> {
    return this.http.post<SemanticSearchResponse>(`${this.apiUrl}/search-issues/`, request);
  }

  /**
   * Find Similar Issues - Find issues similar to a given issue
   * GET /api/v1/ai/{id}/similar-issues/
   */
  findSimilar(issueId: string, limit: number = 5, sameProjectOnly: boolean = true): Observable<FindSimilarResponse> {
    return this.http.get<FindSimilarResponse>(`${this.apiUrl}/${issueId}/similar-issues/`, {
      params: {
        top_k: limit.toString(),
        same_project_only: sameProjectOnly.toString()
      }
    });
  }

  /**
   * Generate Issue Summary - AI-generated summary of issue
   * POST /api/v1/ai/{id}/summarize-issue/
   */
  getIssueSummary(issueId: string): Observable<IssueSummaryResponse> {
    return this.http.post<IssueSummaryResponse>(`${this.apiUrl}/${issueId}/summarize-issue/`, {});
  }

  /**
   * Suggest Solutions - Get AI-powered solution suggestions
   * POST /api/v1/ai/suggest-solutions/
   */
  suggestSolutions(): Observable<{error: string}> {
    return this.http.post<{error: string}>(`${this.apiUrl}/suggest-solutions/`, {});
  }

  /**
   * Generate Sprint Summary - AI-generated sprint retrospective
   */
  getSprintSummary(sprintId: string): Observable<SprintSummaryResponse> {
    // POST /api/v1/ai/summarize-sprint/{id}/
    return this.http.post<SprintSummaryResponse>(`${this.apiUrl}/${sprintId}/summarize-sprint/`, {});
  }

  /**
   * Generate Project Report - Comprehensive AI-generated project report
   */
  generateProjectReport(request: ProjectReportRequest): Observable<ProjectReportResponse> {
    // POST /api/v1/ai/{id}/index-project/
    return this.http.post<ProjectReportResponse>(`${this.apiUrl}/${request.project_id}/index-project/`, request);
  }

  /**
   * Index Issue for Search - Manually index issue for semantic search
   */
  indexIssue(issueId: string, forceReindex: boolean = false): Observable<{success: boolean; message: string}> {
    return this.http.post<{success: boolean; message: string}>(`${this.apiUrl}/index-issue/`, {
      issue_id: issueId,
      force_reindex: forceReindex
    });
  }

  /**
   * Index Project Issues - Batch index all issues in a project
   */
  indexProject(projectId: string): Observable<{success: boolean; indexed_count: number; message: string}> {
    // POST /api/v1/ai/{id}/index-project/
    return this.http.post<{success: boolean; indexed_count: number; message: string}>(`${this.apiUrl}/${projectId}/index-project/`, {});
  }
}
