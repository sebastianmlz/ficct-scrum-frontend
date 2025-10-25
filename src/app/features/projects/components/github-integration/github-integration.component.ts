import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
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
export class GitHubIntegrationComponent implements OnInit {
  @Input() projectId!: string;

  private githubService = inject(GitHubIntegrationService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Signals
  integration = signal<GitHubIntegrationDetail | null>(null);
  loading = signal(false);
  syncing = signal(false);
  showConnectForm = signal(false);
  showDisconnectConfirm = signal(false);

  // Forms
  connectForm: FormGroup = this.fb.group({
    repository_url: ['', [Validators.required, Validators.pattern(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/)]],
    sync_commits: [true],
    sync_pull_requests: [true],
    auto_link_issues: [true]
  });

  ngOnInit(): void {
    this.loadIntegration();
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
              this.integration.set(detail);
              this.loading.set(false);
            },
            error: (error) => {
              console.error('[GITHUB] Error loading integration details:', error);
              this.loading.set(false);
            }
          });
        } else {
          // No integration found
          this.integration.set(null);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[GITHUB] Error checking integration:', error);
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
   * Connect GitHub repository
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
