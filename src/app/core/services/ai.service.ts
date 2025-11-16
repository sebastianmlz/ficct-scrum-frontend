import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, TimeoutError, of, Subject } from 'rxjs';
import { timeout, catchError, map, throttleTime, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AiCacheService } from './ai-cache.service';

// Timeout constants for different model types
const TRADITIONAL_MODEL_TIMEOUT = 10000; // 10 seconds for gpt-4o, gpt-4-turbo
const O_SERIES_MODEL_TIMEOUT = 45000;    // 45 seconds for o4-mini, o1-preview (reasoning takes longer)
const SYNC_ALL_TIMEOUT = 600000;         // 10 minutes for full Pinecone sync-all operation

// Interfaces para las respuestas de los endpoints AI
export interface AIChatRequest {
  question: string;
  project_id: string;
  conversation_id?: string;
}

// NEW: AI Query interfaces matching new backend contract
export interface AIQueryRequest {
  query: string;
}

export interface AISource {
  issue_id: string;
  title: string;
  key?: string;
  project_key?: string;  // Backend returns project_key in some endpoints
  score?: number;        // Similarity score (0-1), sometimes called score
  similarity?: number;   // Same as score, backend uses different names
  description?: string;
  status?: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: AISource[];
}

export interface AIChatResponse {
  response: string;
  conversation_id: string;
  sources: AISource[];  // Backend returns source objects, not strings
  confidence?: number;
  tokens_used?: number;
  suggested_actions?: string[];
}

export interface SemanticSearchRequest {
  query: string;
  project_id?: string;  // Optional for global search
  top_k?: number;       // Renamed from limit for backend consistency
}

// NEW: Issue metadata with sanitized values (null → "unassigned", "unknown")
export interface IssueMetadata {
  assignee_id: string;      // "unassigned" if no assignee
  assignee_name: string;    // "Unassigned" if no assignee
  reporter_id: string;      // "unknown" if no reporter
  reporter_name: string;    // "Unknown" if no reporter
  status: string;
  priority: string;
  issue_type?: string;
  created_at?: string;
  updated_at?: string;
  sprint_id?: string;
  sprint_name?: string;
  [key: string]: any;       // Allow other metadata fields
}

// Updated SearchResult with complete metadata
export interface SearchResult {
  issue_id: string;         // Direct issue_id for easier access
  title: string;
  key?: string;             // Issue key (e.g., PROJ-123)
  score: number;            // Similarity score (0-1)
  metadata: IssueMetadata;  // Complete sanitized metadata
}

export interface SemanticSearchResponse {
  results: SearchResult[];
}

// NEW: Pinecone Sync-All Interfaces
export interface SyncError {
  issue_id: string;
  issue_title?: string;
  error: string;
}

export interface SyncAllRequest {
  clear_existing?: boolean;  // Whether to clear Pinecone before re-indexing
  batch_size?: number;       // Optional batch size for indexing
}

export interface SyncAllResponse {
  status: 'success' | 'partial' | 'error';
  projects_processed: number;
  total_issues: number;
  indexed: number;
  failed: number;
  success_rate: number;      // Percentage (0-100)
  duration_seconds: number;
  errors: SyncError[];       // First 50 errors
  total_errors: number;
}

// Index Project Response
export interface IndexProjectResponse {
  total: number;
  indexed: number;
  failed: number;
  success_rate: number;
  errors: SyncError[];
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

// NEW: AI Project Summary Response matching backend /ml/{id}/project-summary/
export interface ProjectReportResponse {
  completion: number;           // Completion percentage (0-100)
  velocity: number;             // Sprint velocity
  risk_score: number;           // Risk score (0-100)
  project_id: string;
  generated_at: string;         // ISO timestamp
  metrics_breakdown?: {
    total_issues: number;
    completed_issues: number;
    sprints_analyzed: number;
    unassigned_issues: number;
    overdue_issues: number;
  };
  // Legacy fields for backward compatibility (optional)
  report?: string;
  recommendations?: string[];
  metrics?: {                   // Nested metrics (legacy format)
    completion_rate?: number;
    velocity?: number;
    risk_score?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private cache = inject(AiCacheService);
  private apiUrl = `${environment.apiUrl}/api/v1/ai`;
  
  // Export timeout constants for components
  readonly SYNC_TIMEOUT_MS = SYNC_ALL_TIMEOUT;
  readonly QUERY_TIMEOUT_MS = O_SERIES_MODEL_TIMEOUT;
  
  // Throttle subjects for rate limiting
  private similarIssuesSubject = new Subject<{issueId: string, limit: number, sameProjectOnly: boolean}>();
  private issueSummarySubject = new Subject<string>();
  private sprintSummarySubject = new Subject<string>();

  /**
   * AI Chat - Natural language chat interface
   * Maps to /query/ endpoint which returns {answer, sources}
   * Transforms answer → response for component compatibility
   */
  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const queryRequest = {
      question: request.question,
      project_id: request.project_id
    };
    
    return this.http.post<any>(`${this.apiUrl}/query/`, queryRequest).pipe(
      map((response: any) => ({
        response: response.answer || '',
        conversation_id: request.conversation_id || 'default',
        sources: response.sources || [],
        confidence: response.confidence,
        tokens_used: response.tokens_used,
        suggested_actions: response.suggested_actions
      })),
      timeout(O_SERIES_MODEL_TIMEOUT),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * NEW: AI Query - Simple query/answer with sources
   * POST /api/v1/ai/query/
   * Request: {query: string}
   * Response: {answer: string, sources: AISource[]}
   * Backend now uses o4-mini model (Azure OpenAI)
   * 
   * IMPORTANT: O-series models (o4-mini, o1-preview) use reasoning tokens
   * which take 10-30+ seconds to process. Timeout set to 45s.
   */
  query(queryText: string, customTimeout?: number): Observable<AIQueryResponse> {
    const timeoutMs = customTimeout || O_SERIES_MODEL_TIMEOUT;
    const request: AIQueryRequest = { query: queryText };

    return this.http.post<AIQueryResponse>(`${this.apiUrl}/query/`, request).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        if (error instanceof TimeoutError || error.name === 'TimeoutError') {
          return throwError(() => ({
            name: 'TimeoutError',
            status: 408,
            message: `Query took longer than ${timeoutMs / 1000} seconds. The AI model may be processing complex reasoning. Please try again or simplify your query.`,
            error: { type: 'timeout', detail: 'Request timeout' }
          }));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Semantic Search Issues - Search issues using natural language
   * POST /api/v1/ai/search-issues/
   * CACHED: Results cached for 1 hour
   */
  searchIssues(request: SemanticSearchRequest): Observable<SemanticSearchResponse> {
    const cacheKey = `search_${request.query}_${request.project_id || 'all'}_${request.top_k || 10}`;
    
    // Check cache first
    const cached = this.cache.get<SemanticSearchResponse>(cacheKey);
    if (cached) {
      console.log(`[AI-SERVICE] 🚀 Returning cached search results`);
      return of(cached);
    }

    console.log(`[AI-SERVICE] 🌐 Searching issues: "${request.query}"`);
    return this.http.post<SemanticSearchResponse>(`${this.apiUrl}/search-issues/`, request).pipe(
      timeout(O_SERIES_MODEL_TIMEOUT),
      map(response => {
        // Store in cache for 1 hour
        this.cache.set(cacheKey, response, this.cache.TTL_1_HOUR);
        return response;
      }),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Find Similar Issues - Find issues similar to a given issue
   * GET /api/v1/ai/{id}/similar-issues/
   * THROTTLED: Max 1 request per minute per issue
   * CACHED: Results cached for 1 hour
   */
  findSimilar(issueId: string, limit: number = 5, sameProjectOnly: boolean = true): Observable<FindSimilarResponse> {
    const cacheKey = `similar_${issueId}_${limit}_${sameProjectOnly}`;
    
    // Check cache first
    const cached = this.cache.get<FindSimilarResponse>(cacheKey);
    if (cached) {
      console.log(`[AI-SERVICE] 🚀 Returning cached similar issues for ${issueId}`);
      return of(cached);
    }

    console.log(`[AI-SERVICE] 🌐 Fetching similar issues for ${issueId}`);
    return this.http.get<FindSimilarResponse>(`${this.apiUrl}/${issueId}/similar-issues/`, {
      params: {
        top_k: limit.toString(),
        same_project_only: sameProjectOnly.toString()
      }
    }).pipe(
      map(response => {
        // Store in cache
        this.cache.set(cacheKey, response, this.cache.TTL_1_HOUR);
        return response;
      })
    );
  }

  /**
   * Generate Issue Summary - AI-generated summary of issue
   * POST /api/v1/ai/{id}/summarize-issue/
   * THROTTLED: Max 1 request per minute per issue
   * CACHED: Invalidate when issue changes
   */
  getIssueSummary(issueId: string, forceRefresh: boolean = false): Observable<IssueSummaryResponse> {
    const cacheKey = `summary_${issueId}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get<IssueSummaryResponse>(cacheKey);
      if (cached) {
        console.log(`[AI-SERVICE] 🚀 Returning cached summary for ${issueId}`);
        return of(cached);
      }
    }

    console.log(`[AI-SERVICE] 🌐 Generating summary for ${issueId}`);
    return this.http.post<IssueSummaryResponse>(`${this.apiUrl}/${issueId}/summarize-issue/`, {}).pipe(
      map(response => {
        // Store in cache (no TTL - invalidate manually)
        this.cache.set(cacheKey, response, this.cache.TTL_NEVER);
        return response;
      })
    );
  }
  
  /**
   * Invalidate issue summary cache when issue is updated
   */
  invalidateIssueSummary(issueId: string): void {
    this.cache.invalidate(`summary_${issueId}`);
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
   * THROTTLED: Max 1 request per minute per sprint
   * CACHED: Results cached with no expiration (invalidate manually)
   */
  getSprintSummary(sprintId: string, forceRefresh: boolean = false): Observable<SprintSummaryResponse> {
    const cacheKey = `sprint_summary_${sprintId}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get<SprintSummaryResponse>(cacheKey);
      if (cached) {
        console.log(`[AI-SERVICE] 🚀 Returning cached sprint summary for ${sprintId}`);
        return of(cached);
      }
    }

    console.log(`[AI-SERVICE] 🌐 Generating sprint summary for ${sprintId}`);
    return this.http.post<SprintSummaryResponse>(`${this.apiUrl}/${sprintId}/summarize-sprint/`, {}).pipe(
      map(response => {
        // Store in cache (no TTL - invalidate manually)
        this.cache.set(cacheKey, response, this.cache.TTL_NEVER);
        return response;
      })
    );
  }
  
  /**
   * Invalidate sprint summary cache when sprint is updated
   */
  invalidateSprintSummary(sprintId: string): void {
    this.cache.invalidate(`sprint_summary_${sprintId}`);
  }

  /**
   * Generate Project Report - AI-powered project metrics summary
   * NEW ENDPOINT: POST /api/v1/ml/{project_id}/project-summary/
   * 
   * Response: {completion, velocity, risk_score, project_id, generated_at, metrics_breakdown}
   * - completion: Percentage (0-100), NOT decimal (37.5 means 37.5%)
   * - velocity: Sprint velocity metric
   * - risk_score: Risk percentage (0-100)
   * 
   * CACHING STRATEGY:
   * - TTL: 15 minutes (good balance between freshness and API cost reduction)
   * - Invalidation: Manual via invalidateProjectCache() when issues/sprints change
   * - Force Refresh: Bypass cache with forceRefresh=true
   * 
   * TIMEOUT: 45 seconds (ML model may need reasoning time)
   * 
   * @param request - Project report request with project_id
   * @param forceRefresh - If true, bypass cache and fetch fresh data
   */
  generateProjectReport(request: ProjectReportRequest, forceRefresh: boolean = false): Observable<ProjectReportResponse> {
    const cacheKey = `project_summary_${request.project_id}`;
    const mlUrl = `${environment.apiUrl}/api/v1/ml`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get<ProjectReportResponse>(cacheKey);
      if (cached) {
        const age = Date.now() - (new Date(cached.generated_at).getTime());
        console.log(`[AI-SERVICE] 🚀 Returning cached project summary (age: ${Math.floor(age / 1000)}s)`);
        return of(cached);
      }
    } else {
      console.log('[AI-SERVICE] 🔄 Force refresh - bypassing cache');
    }
    
    console.log('[AI-SERVICE] 🤖 Generating project report');
    console.log('[AI-SERVICE] Project ID:', request.project_id);
    console.log('[AI-SERVICE] Endpoint:', `${mlUrl}/${request.project_id}/project-summary/`);
    
    return this.http.post<ProjectReportResponse>(
      `${mlUrl}/${request.project_id}/project-summary/`,
      {}  // Empty body - backend doesn't require payload
    ).pipe(
      timeout(O_SERIES_MODEL_TIMEOUT),
      map(response => {
        console.log('[AI-SERVICE] ✅ Report received:', response);
        console.log('[AI-SERVICE] Metrics:', {
          completion: response.completion,
          velocity: response.velocity,
          risk_score: response.risk_score
        });
        
        // Cache the response for 15 minutes
        const TTL_15_MINUTES = 15 * 60 * 1000;
        this.cache.set(cacheKey, response, TTL_15_MINUTES);
        console.log('[AI-SERVICE] 💾 Cached project summary (TTL: 15min)');
        
        return response;
      }),
      catchError((error) => {
        console.error('[AI-SERVICE] ❌ Report generation failed:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          errorBody: error.error
        });
        
        if (error instanceof TimeoutError || error.name === 'TimeoutError') {
          return throwError(() => ({
            name: 'TimeoutError',
            status: 408,
            message: 'Report generation timed out. Please try again.',
            error: { type: 'timeout', detail: 'Request timeout' }
          }));
        }
        
        // Don't cache errors - let user retry
        return throwError(() => error);
      })
    );
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
   * POST /api/v1/ai/{project_id}/index-project/
   * Takes 5-15 seconds depending on project size
   */
  indexProject(projectId: string, batchSize?: number): Observable<IndexProjectResponse> {
    const payload = batchSize ? { batch_size: batchSize } : {};
    
    return this.http.post<IndexProjectResponse>(`${this.apiUrl}/${projectId}/index-project/`, payload).pipe(
      timeout(O_SERIES_MODEL_TIMEOUT),
      catchError((error) => throwError(() => error))
    );
  }
  
  /**
   * Invalidate project summary cache when project data changes
   * Call this when:
   * - Issue created/updated/deleted
   * - Sprint started/completed
   * - Issue status changed (affects completion rate)
   */
  invalidateProjectCache(projectId: string): void {
    this.cache.invalidate(`project_summary_${projectId}`);
    console.log(`[AI-SERVICE] 🗑️ Invalidated project summary cache for: ${projectId}`);
  }
  
  /**
   * Invalidate index status cache (forces re-index check)
   */
  invalidateIndexCache(projectId: string): void {
    this.cache.invalidate(`index_status_${projectId}`);
    console.log(`[AI-SERVICE] 🗑️ Invalidated index status cache for: ${projectId}`);
  }

  /**
   * NEW: Sync All Pinecone - DESTRUCTIVE operation
   * POST /api/v1/ai/sync-all/
   * Clears all Pinecone data and re-indexes all projects
   * 
   * WARNING: This operation takes 5-10 MINUTES
   * Timeout set to 10 minutes (600 seconds)
   * 
   * @param clearExisting - Whether to clear Pinecone before re-indexing (default: true)
   * @param batchSize - Optional batch size for indexing
   */
  syncAllPinecone(clearExisting: boolean = true, batchSize?: number): Observable<SyncAllResponse> {
    const request: SyncAllRequest = {
      clear_existing: clearExisting
    };
    
    if (batchSize) {
      request.batch_size = batchSize;
    }
    
    return this.http.post<SyncAllResponse>(`${this.apiUrl}/sync-all/`, request).pipe(
      timeout(SYNC_ALL_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError || error.name === 'TimeoutError') {
          return throwError(() => ({
            name: 'TimeoutError',
            status: 408,
            message: `Sync operation took longer than ${SYNC_ALL_TIMEOUT / 1000} seconds. Check backend logs for status.`,
            error: { type: 'timeout', detail: 'Sync timeout' }
          }));
        }
        return throwError(() => error);
      })
    );
  }
}
