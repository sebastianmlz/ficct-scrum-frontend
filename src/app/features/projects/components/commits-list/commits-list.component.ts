import {Component, inject, OnInit, OnDestroy, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {GitHubIntegrationStateService}
  from '../../../../core/services/github-integration-state.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {GitHubCommit, PaginatedGitHubCommitList}
  from '../../../../core/models/interfaces';
import {GitHubConnectPromptComponent}
  from '@components/github-connect-prompt/github-connect-prompt.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-commits-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GitHubConnectPromptComponent],
  templateUrl: './commits-list.component.html',
  styleUrls: ['./commits-list.component.scss'],
})
export class CommitsListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private githubService = inject(GitHubIntegrationService);
  private integrationState = inject(GitHubIntegrationStateService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  commits = signal<GitHubCommit[]>([]);
  loading = signal(false);
  syncing = signal(false);
  noIntegration = signal(false);

  // Sync status
  syncCount = signal(0); // How many NEW commits were synced
  lastSyncAt = signal<string | null>(null); // Last sync timestamp

  // Pagination
  page = signal(1);
  pageSize = 50;
  totalCommits = signal(0);
  hasMore = signal(true);

  // Filters
  searchTerm = signal('');
  selectedAuthor = signal<string | null>(null);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.checkIntegrationAndLoadCommits();
      }
    });
  }

  checkIntegrationAndLoadCommits(): void {
    this.loading.set(true);
    this.noIntegration.set(false);

    // Use centralized state service
    this.integrationState.getIntegrationStatus(this.projectId()).subscribe({
      next: (integration) => {
        if (integration) {
          // AUTO-SYNC: Automatically sync commits from GitHub on component load
          this.autoSyncCommits(integration.id);
        } else {
          this.noIntegration.set(true);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[COMMITS] Error checking integration status:', error);
        this.noIntegration.set(true);
        this.loading.set(false);
      },
    });
  }

  autoSyncCommits(integrationId: string): void {
    console.log('[COMMITS] Auto-syncing commits on component load...');
    this.syncing.set(true);
    this.loading.set(false); // Hide initial loading, show sync state

    this.githubService.syncCommits(integrationId).subscribe({
      next: (syncResponse) => {
        console.log('[COMMITS] Auto-sync completed:', syncResponse);
        // Backend returns commits directly (up to 50)
        if (syncResponse.commits && syncResponse.commits.length > 0) {
          this.commits.set(syncResponse.commits);
          this.totalCommits.set(syncResponse.total_commits);
          this.syncCount.set(syncResponse.synced_count);
          this.lastSyncAt.set(syncResponse.last_sync_at);

          if (syncResponse.synced_count > 0) {
            this.notificationService.success(
                `Auto-synced ${syncResponse.synced_count} new commits`,
            );
          } else {
            this.notificationService.info('Already up to date');
          }
        } else {
          this.notificationService.info('No commits to display');
        }
        this.syncing.set(false);
        this.page.set(1);
        this.hasMore.set(syncResponse.total_commits > 50);
      },
      error: (error) => {
        console.error('[COMMITS] Auto-sync failed:', error);
        this.syncing.set(false);

        // Fallback: Load existing commits from DB if sync fails
        this.notificationService.error('Sync failed, loading existing commits');
        this.loadCommits();
      },
    });
  }

  loadCommits(append = false): void {
    if (this.loading()) return;

    this.loading.set(true);

    const params: any = {
      project: this.projectId(), // CRITICAL: Filter by project
      page: this.page(),
      page_size: this.pageSize,
    };

    if (this.searchTerm()) params.search = this.searchTerm();
    if (this.selectedAuthor()) params.author = this.selectedAuthor();

    this.githubService.getAllCommits(params).subscribe({
      next: (response: PaginatedGitHubCommitList) => {
        if (append) {
          this.commits.set([...this.commits(), ...response.results]);
        } else {
          this.commits.set(response.results);
        }
        this.totalCommits.set(response.count);
        this.hasMore.set(response.next !== null);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Failed to load commits');
        console.error('Error loading commits:', error);
        this.loading.set(false);
      },
    });
  }

  onScroll(): void {
    if (!this.loading() && this.hasMore()) {
      this.page.set(this.page() + 1);
      this.loadCommits(true);
    }
  }

  onSearch(): void {
    this.page.set(1);
    this.commits.set([]);
    this.loadCommits();
  }

  syncCommits(): void {
    // Find active integration for this project
    this.syncing.set(true);

    this.githubService.getIntegrations({project: this.projectId()}).subscribe({
      next: (response) => {
        if (response.results.length > 0) {
          const integration = response.results[0];
          this.githubService.syncCommits(integration.id).subscribe({
            next: (syncResponse) => {
              // Backend returns commits directly in response (up to 50)
              if (syncResponse.commits && syncResponse.commits.length > 0) {
                this.commits.set(syncResponse.commits);
                this.totalCommits.set(syncResponse.total_commits);
                this.syncCount.set(syncResponse.synced_count);
                this.lastSyncAt.set(syncResponse.last_sync_at); // Timestamp

                this.notificationService.success(
                    `Successfully synced ${
                      syncResponse.synced_count} new commits`,
                );
              } else {
                this.notificationService.info('No new commits to sync');
              }
              this.syncing.set(false);
              // Reset pagination (showing first 50)
              this.page.set(1);
              this.hasMore.set(syncResponse.total_commits > 50);
            },
            error: (error) => {
              console.error('Error syncing commits:', error);
              if (error.status === 403) {
                this.notificationService.error('No permission to sync commits');
              } else if (error.status === 404) {
                this.notificationService.error('Repository not found');
              } else {
                this.notificationService.error('Failed to sync commits');
              }
              this.syncing.set(false);
            },
          });
        } else {
          this.notificationService.error(
              'No GitHub integration found for this project');
          this.syncing.set(false);
        }
      },
      error: () => {
        this.notificationService.error('Failed to find GitHub integration');
        this.syncing.set(false);
      },
    });
  }

  openCommitUrl(commit: GitHubCommit): void {
    if (commit.url) {
      window.open(commit.url, '_blank', 'noopener,noreferrer');
    }
  }

  openIssue(issueKey: string): void {
    // Navigate to issue detail by key
    this.router.navigate(['/projects', this.projectId(), 'issues'], {
      queryParams: {search: issueKey},
    });
  }

  getTimeAgo(date: string | null | undefined): string {
    if (!date) return '';


    const now = new Date();
    const commitDate = new Date(date);
    const seconds = Math.floor((now.getTime() - commitDate.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
