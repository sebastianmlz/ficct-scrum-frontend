import { Component, Input, OnInit, OnChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
import { GitHubIntegrationStateService } from '../../../../core/services/github-integration-state.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  GitHubIntegration,
  GitHubIntegrationDetail,
  GitHubIntegrationRequest
} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-github-integration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './github-integration.component.html',
  styleUrl: './github-integration.component.scss'
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

  // Forms
  connectForm: FormGroup = this.fb.group({
    repository_url: ['', [Validators.required, Validators.pattern(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/)]],
    sync_commits: [true],
    sync_pull_requests: [true],
    auto_link_issues: [true]
  });

  ngOnInit(): void {
    // CRITICAL: Validate project ID on init
    if (!this.projectId) {
      console.warn('[GITHUB] ⚠️ Project ID not provided on init, waiting for input binding...');
      return;
    }
    console.log('[GITHUB] Component initialized with project ID:', this.projectId);
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
    
    this.githubService.getIntegrations({ project: this.projectId }).subscribe({
      next: (response) => {
        if (response.results && response.results.length > 0) {
          // Project already has integration, load details
          this.githubService.getIntegration(response.results[0].id).subscribe({
            next: (detail) => {
              if (detail) {
                this.integration.set(detail);
                console.log('[GITHUB] Integration loaded:', detail.repository_full_name);
              } else {
                console.info('[GITHUB] Integration not found (404)');
                this.integration.set(null);
              }
              this.loading.set(false);
            },
            error: (error) => {
              console.error('[GITHUB] Error loading integration details:', error);
              this.integration.set(null);
              this.loading.set(false);
            }
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
      }
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
      auto_link_issues: true
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
      this.notificationService.error('Project ID is missing. Please refresh the page.');
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
        console.log('[GITHUB] OAuth initiation successful, authorization URL:', response.authorization_url);
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
            'You need project admin permissions to connect GitHub'
          );
        } else {
          this.notificationService.error(
            error.error?.detail || 'Failed to initiate GitHub connection'
          );
        }
      }
    });
  }

  /**
   * Connect GitHub repository (Direct method with Personal Access Token)
   * @deprecated Use onConnectWithOAuth() instead for OAuth flow
   */
  onConnectRepository(): void {
    if (this.connectForm.invalid) {
      this.notificationService.error('Please enter a valid GitHub repository URL');
      return;
    }

    this.loading.set(true);

    const requestData: GitHubIntegrationRequest = {
      project: this.projectId,
      repository_url: this.connectForm.value.repository_url,
      sync_commits: this.connectForm.value.sync_commits,
      sync_pull_requests: this.connectForm.value.sync_pull_requests,
      auto_link_issues: this.connectForm.value.auto_link_issues
    };

    this.githubService.connectRepository(requestData).subscribe({
      next: (integration) => {
        console.log('[GITHUB] Repository connected:', integration);
        this.notificationService.success('GitHub repository connected successfully');
        this.showConnectForm.set(false);
        this.loading.set(false);
        
        // Load full integration details
        this.loadIntegration();
      },
      error: (error) => {
        console.error('[GITHUB] Error connecting repository:', error);
        this.notificationService.error(
          error.error?.detail || 'Failed to connect GitHub repository'
        );
        this.loading.set(false);
      }
    });
  }

  /**
   * Update integration settings
   */
  onUpdateSettings(field: string, value: boolean): void {
    const currentIntegration = this.integration();
    if (!currentIntegration) return;

    const updateData: any = {};
    updateData[field] = value;

    this.githubService.updateIntegration(currentIntegration.id, updateData).subscribe({
      next: (updated) => {
        console.log('[GITHUB] Settings updated:', updated);
        this.integration.set({ ...currentIntegration, ...updated });
        this.notificationService.success('Settings updated');
      },
      error: (error) => {
        console.error('[GITHUB] Error updating settings:', error);
        this.notificationService.error('Failed to update settings');
      }
    });
  }

  /**
   * Manually sync commits
   */
  onSyncCommits(): void {
    const currentIntegration = this.integration();
    if (!currentIntegration) return;

    this.syncing.set(true);

    this.githubService.syncCommits(currentIntegration.id).subscribe({
      next: (response) => {
        console.log('[GITHUB] Sync complete:', response);
        this.notificationService.success(
          `Synced ${response.commits_synced} commits, linked ${response.issues_linked} issues`
        );
        this.syncing.set(false);
        this.loadIntegration(); // Refresh integration data
      },
      error: (error) => {
        console.error('[GITHUB] Error syncing commits:', error);
        this.notificationService.error('Failed to sync commits');
        this.syncing.set(false);
      }
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
      }
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
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  /**
   * Get repository name from URL
   */
  getRepoName(): string {
    const integration = this.integration();
    if (!integration) return '';
    return integration.repository_full_name || integration.repository_url.split('/').slice(-2).join('/');
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
