import {Component, Input, OnInit, OnChanges, signal, inject}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators}
  from '@angular/forms';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {GitHubIntegrationStateService}
  from '../../../../core/services/github-integration-state.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {
  GitHubIntegrationDetail,
  GitHubIntegrationRequest,
} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-github-integration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './github-integration.component.html',
  styleUrl: './github-integration.component.scss',
})
export class GitHubIntegrationComponent implements OnInit, OnChanges {
  @Input() projectId!: string;

  private githubService = inject(GitHubIntegrationService);
  private integrationState = inject(GitHubIntegrationStateService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Signals
  integration = signal<GitHubIntegrationDetail | null>(null);
  loading = signal(false);
  syncing = signal(false);
  showConnectForm = signal(false);
  showDisconnectConfirm = signal(false);
  connectingOAuth = signal(false);

  // Toggle loading states
  savingSyncCommits = signal(false);
  savingSyncPullRequests = signal(false);
  savingAutoLinkIssues = signal(false);

  // Forms
  connectForm: FormGroup = this.fb.group({
    repository_url: ['', [Validators.required,
      Validators.pattern(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/)]],
    sync_commits: [true],
    sync_pull_requests: [true],
    auto_link_issues: [true],
  });

  ngOnInit(): void {
    // CRITICAL: Validate project ID on init
    if (!this.projectId) {
      console.warn('[GITHUB] ⚠️ Project ID not provided on init, ' +
        'waiting for input binding...');
      return;
    }
    console.log('[GITHUB] Component initialized with project ID:',
        this.projectId);
    this.loadIntegration();
  }

  /**
   * Angular lifecycle hook - called when input properties change
   */
  ngOnChanges(): void {
    if (this.projectId && !this.integration()) {
      console.log('[GITHUB] Project ID changed to:', this.projectId);
      this.loadIntegration();
    }
  }

  /**
   * Load existing GitHub integration for this project
   */
  loadIntegration(): void {
    this.loading.set(true);

    console.log('[GITHUB] Loading integration for project:', this.projectId);

    this.githubService.getIntegrations({project: this.projectId}).subscribe({
      next: (response) => {
        if (response.results && response.results.length > 0) {
          // Project already has integration, load details
          this.githubService.getIntegration(response.results[0].id).subscribe({
            next: (detail) => {
              if (detail) {
                this.integration.set(detail);
                console.log('[GITHUB] Integration loaded:',
                    detail.repository_full_name);
                console.log('[GITHUB] Commit count:', detail.commit_count);
                console.log('[GITHUB] Pull request count:',
                    detail.pull_request_count);
                console.log('[GITHUB] Last synced:', detail.last_synced_at);

                // Log if data needs syncing
                if (!detail.last_synced_at) {
                  console.warn('[GITHUB] Integration has never been synced. ' +
                    'Click "Sync Now" to fetch data.');
                }
                if (detail.commit_count === 0 &&
                  detail.pull_request_count === 0) {
                  console.warn('[GITHUB] No commits or PRs found. ' +
                    'Repository might be empty or needs syncing.');
                }
              } else {
                console.info('[GITHUB] Integration not found (404)');
                this.integration.set(null);
              }
              this.loading.set(false);
            },
            error: (error) => {
              console.error('[GITHUB] Error loading integration details:',
                  error);
              this.integration.set(null);
              this.loading.set(false);
            },
          });
        } else {
          // No integration found
          console.info('[GITHUB] No integration configured for this project');
          this.integration.set(null);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[GITHUB] Error checking integration:', error);
        this.integration.set(null);
        this.loading.set(false);
      },
    });
  }

  /**
   * Show connect form
   */
  onShowConnectForm(): void {
    this.showConnectForm.set(true);
  }

  /**
   * Cancel connect form
   */
  onCancelConnect(): void {
    this.showConnectForm.set(false);
    this.connectForm.reset({
      sync_commits: true,
      sync_pull_requests: true,
      auto_link_issues: true,
    });
  }

  /**
   * Initiate GitHub OAuth flow
   * User will be redirected to GitHub for authorization
   */
  onConnectWithOAuth(): void {
    // CRITICAL: Validate project ID before proceeding
    if (!this.projectId || this.projectId.trim() === '') {
      console.error('[GITHUB] ❌ CRITICAL: Project ID is empty or undefined!');
      this.notificationService.error('Project ID is missing. Please ' +
        'refresh the page.');
      return;
    }

    console.log('[GITHUB] Initiating OAuth flow for project:', this.projectId);
    console.log('[GITHUB] Project ID length:', this.projectId.length);
    console.log('[GITHUB] Project ID type:', typeof this.projectId);
    this.connectingOAuth.set(true);

    // Save project ID to localStorage for callback
    localStorage.setItem('github_oauth_project_id', this.projectId);

    this.githubService.initiateOAuth(this.projectId).subscribe({
      next: (response) => {
        console.log('[GITHUB] OAuth initiation successful, authorization URL:',
            response.authorization_url);
        console.log('[GITHUB] OAuth state:', response.state);

        // Redirect to GitHub authorization page
        window.location.href = response.authorization_url;
      },
      error: (error) => {
        console.error('[GITHUB] Error initiating OAuth:', error);
        this.connectingOAuth.set(false);

        // Handle specific error cases
        if (error.status === 403) {
          this.notificationService.error(
              'You need project admin permissions to connect GitHub',
          );
        } else {
          this.notificationService.error(
              error.error?.detail || 'Failed to initiate GitHub connection',
          );
        }
      },
    });
  }

  /**
   * Connect GitHub repository (Direct method with Personal Access Token)
   * @deprecated Use onConnectWithOAuth() instead for OAuth flow
   */
  onConnectRepository(): void {
    if (this.connectForm.invalid) {
      this.notificationService.error('Please enter a valid GitHub ' +
        'repository URL');
      return;
    }

    this.loading.set(true);

    const requestData: GitHubIntegrationRequest = {
      project: this.projectId,
      repository_url: this.connectForm.value.repository_url,
      sync_commits: this.connectForm.value.sync_commits,
      sync_pull_requests: this.connectForm.value.sync_pull_requests,
      auto_link_issues: this.connectForm.value.auto_link_issues,
    };

    this.githubService.connectRepository(requestData).subscribe({
      next: (integration) => {
        console.log('[GITHUB] Repository connected:', integration);
        this.notificationService.success('GitHub repository connected ' +
          'successfully');
        this.showConnectForm.set(false);
        this.loading.set(false);

        // Load full integration details
        this.loadIntegration();
      },
      error: (error) => {
        console.error('[GITHUB] Error connecting repository:', error);
        this.notificationService.error(
            error.error?.detail || 'Failed to connect GitHub repository',
        );
        this.loading.set(false);
      },
    });
  }

  /**
   * Update integration settings with proper state management
   */
  onUpdateSettings(field: string, value: boolean, event: Event): void {
    const currentIntegration = this.integration();
    if (!currentIntegration) return;

    // Prevent default checkbox behavior - we'll update it manually
    event.preventDefault();

    // Set loading state for specific toggle
    this.setToggleLoading(field, true);

    console.log(`[GITHUB] Updating ${field} to:`, value);
    console.log('[GITHUB] Integration ID:', currentIntegration.id);

    const updateData: any = {};
    updateData[field] = value;

    this.githubService.updateIntegration(currentIntegration.id, updateData)
        .subscribe({
          next: (updated) => {
            console.log('[GITHUB] Settings updated successfully:', updated);
            console.log(`[GITHUB] ${field} is now:`, (updated as any)[field]);

            // Update integration state with response from backend
            this.integration.set({...currentIntegration, ...updated});
            this.notificationService.success('Settings updated successfully');

            this.setToggleLoading(field, false);
          },
          error: (error) => {
            console.error('[GITHUB] Error updating settings:', error);
            console.error('[GITHUB] Error status:', error.status);
            console.error('[GITHUB] Error body:', error.error);

            // Revert the checkbox state (it stays at old value)
            this.notificationService.error(
                error.error?.detail || 'Failed to update settings',
            );

            this.setToggleLoading(field, false);
          },
        });
  }

  /**
   * Set loading state for specific toggle
   */
  private setToggleLoading(field: string, loading: boolean): void {
    switch (field) {
      case 'sync_commits':
        this.savingSyncCommits.set(loading);
        break;
      case 'sync_pull_requests':
        this.savingSyncPullRequests.set(loading);
        break;
      case 'auto_link_issues':
        this.savingAutoLinkIssues.set(loading);
        break;
    }
  }

  /**
   * Check if any toggle is currently saving
   */
  isAnyToggleSaving(): boolean {
    return this.savingSyncCommits() ||
           this.savingSyncPullRequests() ||
           this.savingAutoLinkIssues();
  }

  /**
   * Manually sync commits from GitHub
   * This can take 1-2 minutes for large repositories
   */
  onSyncCommits(): void {
    const currentIntegration = this.integration();
    if (!currentIntegration) {
      console.error('[GITHUB] Cannot sync: No integration loaded');
      return;
    }

    console.log('[GITHUB] Starting manual sync for integration:',
        currentIntegration.id);

    this.syncing.set(true);

    this.githubService.syncCommits(currentIntegration.id).subscribe({
      next: (response) => {
        console.log('[GITHUB] ✅ Sync complete:', response);

        // Handle both legacy and new response formats
        const commitCount = response.commits_synced ||
          response.synced_count || 0;
        const issuesLinked = response.issues_linked || 0;

        console.log('[GITHUB] Commits synced:', commitCount);
        console.log('[GITHUB] Issues linked:', issuesLinked);

        // Show success message
        if (issuesLinked > 0) {
          this.notificationService.success(
              `Synced ${commitCount} commits and linked ${issuesLinked} issues`,
          );
        } else {
          this.notificationService.success(
              `Synced ${commitCount} commits from GitHub`,
          );
        }

        this.syncing.set(false);

        // Refresh integration data to show updated counts
        console.log('[GITHUB] Refreshing integration data...');
        this.loadIntegration();
      },
      error: (error) => {
        console.error('[GITHUB] ❌ Sync failed:', error);
        console.error('[GITHUB] Error status:', error.status);
        console.error('[GITHUB] Error name:', error.name);
        console.error('[GITHUB] Error message:', error.message);

        this.syncing.set(false);

        // Show user-friendly error message based on error type
        let errorMessage = 'Failed to sync commits';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Sync is taking longer than expected. ' +
            'Your repository might be very large. ' +
            'Try again in a few minutes or contact support.';
        } else if (error.message) {
          // Use the enhanced error message from service
          errorMessage = error.message;
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.status === 0) {
          errorMessage = 'Network error. Please check your internet ' +
            'connection and try again.';
        }

        console.error('[GITHUB] Showing error to user:', errorMessage);
        this.notificationService.error(errorMessage);
      },
    });
  }

  /**
   * Show disconnect confirmation
   */
  onShowDisconnectConfirm(): void {
    this.showDisconnectConfirm.set(true);
  }

  /**
   * Cancel disconnect
   */
  onCancelDisconnect(): void {
    this.showDisconnectConfirm.set(false);
  }

  /**
   * Disconnect GitHub repository
   */
  onDisconnectRepository(): void {
    const currentIntegration = this.integration();
    if (!currentIntegration) return;

    this.loading.set(true);

    this.githubService.disconnectRepository(currentIntegration.id).subscribe({
      next: () => {
        console.log('[GITHUB] Repository disconnected');
        this.notificationService.success('GitHub repository disconnected');
        this.integration.set(null);
        this.showDisconnectConfirm.set(false);
        this.loading.set(false);

        // Clear and refresh state service cache
        console.log('[GITHUB] Clearing state service cache after disconnect');
        this.integrationState.clearCache(this.projectId);
        this.integrationState.updateCache(this.projectId, null);
      },
      error: (error) => {
        console.error('[GITHUB] Error disconnecting:', error);
        this.notificationService.error('Failed to disconnect repository');
        this.loading.set(false);
      },
    });
  }

  /**
   * Get time since last sync
   */
  getTimeSinceSync(): string {
    const integration = this.integration();
    if (!integration?.last_synced_at) return 'Never';

    const lastSync = new Date(integration.last_synced_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  /**
   * Get repository name from URL
   */
  getRepoName(): string {
    const integration = this.integration();
    if (!integration) return ''; {
      return integration.repository_full_name ||
      integration.repository_url.split('/').slice(-2).join('/');
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(): string {
    const integration = this.integration();
    if (!integration) return 'gray';

    switch (integration.status) {
      case 'active': return 'green';
      case 'error': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  }
}
