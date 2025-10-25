import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GitHubMetrics } from '../../../../core/models/interfaces';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-dashboard.component.html',
  styleUrls: ['./metrics-dashboard.component.scss']
})
export class MetricsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('commitTrendCanvas') commitTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contributorCanvas') contributorCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('prStatusCanvas') prStatusCanvas!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private githubService = inject(GitHubIntegrationService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  integrationId = signal<string | null>(null);
  metrics = signal<GitHubMetrics | null>(null);
  loading = signal(false);
  
  private commitTrendChart: Chart | null = null;
  private contributorChart: Chart | null = null;
  private prStatusChart: Chart | null = null;

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadIntegrationAndMetrics();
      }
    });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after metrics load
  }

  loadIntegrationAndMetrics(): void {
    this.loading.set(true);
    
    // First, find the integration for this project
    this.githubService.getIntegrations({ project: this.projectId() }).subscribe({
      next: (response) => {
        if (response.results.length > 0) {
          const integration = response.results[0];
          this.integrationId.set(integration.id);
          this.loadMetrics(integration.id);
        } else {
          this.notificationService.error('No GitHub integration found for this project');
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.notificationService.error('Failed to load GitHub integration');
        console.error('Error loading integration:', error);
        this.loading.set(false);
      }
    });
  }

  loadMetrics(integrationId: string): void {
    this.githubService.getMetrics(integrationId).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
        // Initialize charts after view is ready
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        this.notificationService.error('Failed to load metrics');
        console.error('Error loading metrics:', error);
        this.loading.set(false);
      }
    });
  }

  initializeCharts(): void {
    const metrics = this.metrics();
    if (!metrics) return;

    this.createCommitTrendChart();
    this.createContributorChart();
    this.createPRStatusChart();
  }

  createCommitTrendChart(): void {
    const metrics = this.metrics();
    if (!metrics || !this.commitTrendCanvas) return;

    const ctx = this.commitTrendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (this.commitTrendChart) {
      this.commitTrendChart.destroy();
    }

    const labels = metrics.commit_activity.map(activity => {
      const date = new Date(activity.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.commitTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Commits',
            data: metrics.commit_activity.map(a => a.commits),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Additions',
            data: metrics.commit_activity.map(a => a.additions),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Deletions',
            data: metrics.commit_activity.map(a => a.deletions),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createContributorChart(): void {
    const metrics = this.metrics();
    if (!metrics || !this.contributorCanvas) return;

    const ctx = this.contributorCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (this.contributorChart) {
      this.contributorChart.destroy();
    }

    // Get top 10 contributors by commit count
    const topContributors = [...metrics.contributors]
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10);

    this.contributorChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topContributors.map(c => c.user),
        datasets: [
          {
            label: 'Commits',
            data: topContributors.map(c => c.commits),
            backgroundColor: '#3B82F6'
          },
          {
            label: 'Pull Requests',
            data: topContributors.map(c => c.pull_requests),
            backgroundColor: '#8B5CF6'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createPRStatusChart(): void {
    const metrics = this.metrics();
    if (!metrics || !this.prStatusCanvas) return;

    const ctx = this.prStatusCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (this.prStatusChart) {
      this.prStatusChart.destroy();
    }

    const closedPRs = metrics.total_pull_requests - metrics.open_pull_requests - metrics.merged_pull_requests;

    this.prStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Open', 'Merged', 'Closed'],
        datasets: [{
          data: [
            metrics.open_pull_requests,
            metrics.merged_pull_requests,
            closedPRs
          ],
          backgroundColor: [
            '#10B981', // green for open
            '#8B5CF6', // purple for merged
            '#EF4444'  // red for closed
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }

  refreshMetrics(): void {
    if (this.integrationId()) {
      this.loadMetrics(this.integrationId()!);
    }
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  ngOnDestroy(): void {
    // Clean up charts
    if (this.commitTrendChart) {
      this.commitTrendChart.destroy();
    }
    if (this.contributorChart) {
      this.contributorChart.destroy();
    }
    if (this.prStatusChart) {
      this.prStatusChart.destroy();
    }
  }
}
