import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GitHubIntegration,
  GitHubIntegrationDetail,
  GitHubIntegrationRequest,
  PatchedGitHubIntegrationRequest,
  GitHubCommit,
  GitHubCommitDetail,
  GitHubPullRequest,
  GitHubMetrics,
  CommitIssueLinkRequest,
  SyncCommitsResponse,
  PaginatedGitHubIntegrationList,
  PaginatedGitHubCommitList,
  PaginationParams,
  GitHubOAuthRepositoriesResponse,
  GitHubOAuthCompleteRequest
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GitHubIntegrationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/integrations`;

  // ===========================
  // GITHUB INTEGRATION CRUD
  // ===========================

  /**
   * List all GitHub integrations
   */
  getIntegrations(params?: PaginationParams): Observable<PaginatedGitHubIntegrationList> {
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
    if (params?.project) {
      httpParams = httpParams.set('project', params.project);
    }

    return this.http.get<PaginatedGitHubIntegrationList>(`${this.baseUrl}/github/`, { params: httpParams });
  }

  /**
   * Get single GitHub integration details
   */
  getIntegration(id: string): Observable<GitHubIntegrationDetail> {
    return this.http.get<GitHubIntegrationDetail>(`${this.baseUrl}/github/${id}/`);
  }

  /**
   * Connect GitHub repository to project
   */
  connectRepository(data: GitHubIntegrationRequest): Observable<GitHubIntegration> {
    return this.http.post<GitHubIntegration>(`${this.baseUrl}/github/`, data);
  }

  /**
   * Update GitHub integration settings
   */
  updateIntegration(id: string, data: PatchedGitHubIntegrationRequest): Observable<GitHubIntegration> {
    return this.http.patch<GitHubIntegration>(`${this.baseUrl}/github/${id}/`, data);
  }

  /**
   * Disconnect GitHub repository
   */
  disconnectRepository(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/github/${id}/`);
  }

  // ===========================
  // OAUTH FLOW
  // ===========================

  /**
   * Initiate GitHub OAuth flow
   * Returns authorization URL to redirect user to GitHub
   */
  initiateOAuth(projectId: string): Observable<{ authorization_url: string; state: string }> {
    return this.http.post<{ authorization_url: string; state: string }>(
      `${this.baseUrl}/github/oauth/initiate/`,
      { project: projectId }
    );
  }

  /**
   * Check if project has GitHub integration
   * Returns integration details if exists, null if not
   */
  checkIntegrationStatus(projectId: string): Observable<GitHubIntegration | null> {
    return this.getIntegrations({ project: projectId }).pipe(
      map(response => {
        if (response.results && response.results.length > 0) {
          return response.results[0];
        }
        return null;
      })
    );
  }

  /**
   * Get available repositories for OAuth user
   * Called after OAuth callback with temp token
   */
  getAvailableRepositories(projectId: string, tempToken: string): Observable<GitHubOAuthRepositoriesResponse> {
    return this.http.get<GitHubOAuthRepositoriesResponse>(
      `${this.baseUrl}/github/oauth/repositories/`,
      { params: { project: projectId, temp_token: tempToken } }
    );
  }

  /**
   * Complete GitHub integration with selected repository
   * Final step in OAuth flow
   */
  completeIntegration(data: GitHubOAuthCompleteRequest): Observable<{status: string; message: string; integration_id: string; repository: string}> {
    return this.http.post<{status: string; message: string; integration_id: string; repository: string}>(
      `${this.baseUrl}/github/oauth/complete/`,
      data
    );
  }

  // ===========================
  // COMMITS
  // ===========================

  /**
   * List commits for a GitHub integration
   */
  getCommits(integrationId: string, params?: { since?: string; limit?: number }): Observable<GitHubCommit[]> {
    let httpParams = new HttpParams();

    if (params?.since) {
      httpParams = httpParams.set('since', params.since);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<GitHubCommit[]>(`${this.baseUrl}/github/${integrationId}/commits/`, { params: httpParams });
  }

  /**
   * List all commits (paginated)
   * IMPORTANT: Should be filtered by project to show only project-specific commits
   */
  getAllCommits(params?: any): Observable<PaginatedGitHubCommitList> {
    let httpParams = new HttpParams();

    if (params?.project) {
      httpParams = httpParams.set('project', params.project);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.author) {
      httpParams = httpParams.set('author', params.author);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }

    return this.http.get<PaginatedGitHubCommitList>(`${this.baseUrl}/commits/`, { params: httpParams });
  }

  /**
   * Get single commit details
   */
  getCommit(commitId: string): Observable<GitHubCommitDetail> {
    return this.http.get<GitHubCommitDetail>(`${this.baseUrl}/commits/${commitId}/`);
  }

  /**
   * Manually sync commits from GitHub
   */
  syncCommits(integrationId: string): Observable<SyncCommitsResponse> {
    return this.http.post<SyncCommitsResponse>(`${this.baseUrl}/github/${integrationId}/sync_commits/`, {});
  }

  /**
   * Link commit to an issue
   */
  linkCommitToIssue(commitId: string, data: CommitIssueLinkRequest): Observable<GitHubCommitDetail> {
    return this.http.post<GitHubCommitDetail>(`${this.baseUrl}/commits/${commitId}/link_issue/`, data);
  }

  /**
   * Unlink commit from an issue
   */
  unlinkCommitFromIssue(commitId: string, issueId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/commits/${commitId}/unlink_issue/`, { issue_id: issueId });
  }

  // ===========================
  // PULL REQUESTS
  // ===========================

  /**
   * Get pull requests for integration
   */
  getPullRequests(integrationId: string): Observable<GitHubPullRequest[]> {
    return this.http.get<GitHubPullRequest[]>(`${this.baseUrl}/github/${integrationId}/pull_requests/`);
  }

  // ===========================
  // METRICS & ANALYTICS
  // ===========================

  /**
   * Get code metrics for integration
   */
  getMetrics(integrationId: string): Observable<GitHubMetrics> {
    return this.http.get<GitHubMetrics>(`${this.baseUrl}/github/${integrationId}/metrics/`);
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  /**
   * Parse commit message for issue references
   * Detects patterns: #123, PROJ-456
   */
  parseIssueReferences(message: string): string[] {
    const pattern = /#(\d+)|([A-Z]+-\d+)/g;
    const matches = message.match(pattern);
    return matches ? matches : [];
  }

  /**
   * Check if commit message contains smart commit keywords
   */
  hasSmartCommitKeyword(message: string): boolean {
    const keywords = ['close', 'closes', 'closed', 'fix', 'fixes', 'fixed', 'resolve', 'resolves', 'resolved'];
    const messageLower = message.toLowerCase();
    return keywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Extract smart commit actions from message
   */
  parseSmartCommitActions(message: string): Array<{action: string; issueRef: string}> {
    const actions: Array<{action: string; issueRef: string}> = [];
    const pattern = /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(#\d+|[A-Z]+-\d+)/gi;
    
    let match;
    while ((match = pattern.exec(message)) !== null) {
      actions.push({
        action: match[1].toLowerCase(),
        issueRef: match[2]
      });
    }
    
    return actions;
  }
}
