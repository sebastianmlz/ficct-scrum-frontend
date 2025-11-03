import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
import { GitHubIntegrationStateService } from '../../../../core/services/github-integration-state.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GitHubPullRequest } from '../../../../core/models/interfaces';
import { GitHubConnectPromptComponent } from '../../../../shared/components/github-connect-prompt/github-connect-prompt.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pull-requests-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GitHubConnectPromptComponent],
  templateUrl: './pull-requests-list.component.html',
  styleUrls: ['./pull-requests-list.component.scss']
})
export class PullRequestsListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private githubService = inject(GitHubIntegrationService);
  private integrationState = inject(GitHubIntegrationStateService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  integrationId = signal<string | null>(null);
  pullRequests = signal<GitHubPullRequest[]>([]);
  filteredPRs = signal<GitHubPullRequest[]>([]);
  loading = signal(false);
  noIntegration = signal(false);
  
  // Filters
  activeTab = signal<'all' | 'open' | 'closed' | 'merged'>('all');
  searchTerm = signal('');
  selectedAuthor = signal<string | null>(null);
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.checkIntegrationAndLoadPRs();
      }
    });
  }

  checkIntegrationAndLoadPRs(): void {
    this.loading.set(true);
    this.noIntegration.set(false);
    
    console.log('[PULL REQUESTS] Using centralized state service');
    
    // Use centralized state service
    this.integrationState.getIntegrationStatus(this.projectId()).subscribe({
      next: (integration) => {
        if (integration) {
          console.log('[PULL REQUESTS] Integration found via state service:', integration.id);
          this.integrationId.set(integration.id);
          this.loadPullRequests(integration.id);
        } else {
          console.log('[PULL REQUESTS] No GitHub integration (from state service)');
          this.noIntegration.set(true);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[PULL REQUESTS] Error from state service:', error);
        this.noIntegration.set(true);
        this.loading.set(false);
      }
    });
  }

  // Deprecated - replaced by checkIntegrationAndLoadPRs
  loadIntegrationAndPRs(): void {
    this.checkIntegrationAndLoadPRs();
  }

  loadPullRequests(integrationId: string): void {
    this.githubService.getPullRequests(integrationId).subscribe({
      next: (prs) => {
        this.pullRequests.set(prs);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Failed to load pull requests');
        console.error('Error loading PRs:', error);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.pullRequests()];
    
    // Filter by state
    if (this.activeTab() !== 'all') {
      filtered = filtered.filter(pr => pr.state === this.activeTab());
    }
    
    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(pr => 
        pr.title.toLowerCase().includes(term) ||
        pr.author.login.toLowerCase().includes(term) ||
        (pr.body && pr.body.toLowerCase().includes(term))
      );
    }
    
    // Filter by author
    if (this.selectedAuthor()) {
      filtered = filtered.filter(pr => pr.author.login === this.selectedAuthor());
    }
    
    this.filteredPRs.set(filtered);
  }

  changeTab(tab: 'all' | 'open' | 'closed' | 'merged'): void {
    this.activeTab.set(tab);
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  getTabCount(state: 'all' | 'open' | 'closed' | 'merged'): number {
    if (state === 'all') return this.pullRequests().length;
    return this.pullRequests().filter(pr => pr.state === state).length;
  }

  getPRStatusClass(state: string): string {
    switch (state) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'merged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getReviewStatusClass(state: string): string {
    switch (state) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'CHANGES_REQUESTED':
        return 'bg-red-100 text-red-800';
      case 'COMMENTED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  openPRUrl(pr: GitHubPullRequest): void {
    window.open(pr.url, '_blank', 'noopener,noreferrer');
  }

  openIssue(issueId: string): void {
    this.router.navigate(['/projects', this.projectId(), 'issues', issueId]);
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const prDate = new Date(date);
    const seconds = Math.floor((now.getTime() - prDate.getTime()) / 1000);
    
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

  refreshPRs(): void {
    if (this.integrationId()) {
      this.loadPullRequests(this.integrationId()!);
    }
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
