import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GitHubCommit, PaginatedGitHubCommitList } from '../../../../core/models/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-commits-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commits-list.component.html',
  styleUrls: ['./commits-list.component.scss']
})
export class CommitsListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private githubService = inject(GitHubIntegrationService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  commits = signal<GitHubCommit[]>([]);
  loading = signal(false);
  syncing = signal(false);
  
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
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadCommits();
      }
    });
  }

  loadCommits(append = false): void {
    if (this.loading()) return;
    
    this.loading.set(true);
    
    const params: any = {
      page: this.page(),
      page_size: this.pageSize
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
      }
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
    
    this.githubService.getIntegrations({ project: this.projectId() }).subscribe({
      next: (response) => {
        if (response.results.length > 0) {
          const integration = response.results[0];
          this.githubService.syncCommits(integration.id).subscribe({
            next: (syncResponse) => {
              this.notificationService.success(
                `Synced ${syncResponse.commits_synced} commits, linked ${syncResponse.issues_linked} issues`
              );
              this.syncing.set(false);
              this.page.set(1);
              this.loadCommits();
            },
            error: () => {
              this.notificationService.error('Failed to sync commits');
              this.syncing.set(false);
            }
          });
        } else {
          this.notificationService.error('No GitHub integration found for this project');
          this.syncing.set(false);
        }
      },
      error: () => {
        this.notificationService.error('Failed to find GitHub integration');
        this.syncing.set(false);
      }
    });
  }

  openCommitUrl(commit: GitHubCommit): void {
    window.open(commit.url, '_blank', 'noopener,noreferrer');
  }

  openIssue(issueId: string): void {
    // Navigate to issue detail
    this.router.navigate(['/projects', this.projectId(), 'issues', issueId]);
  }

  getShortSha(sha: string): string {
    return sha.slice(0, 7);
  }

  getTimeAgo(date: string): string {
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
