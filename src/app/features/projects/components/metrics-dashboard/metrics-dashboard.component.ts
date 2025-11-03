import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GitHubIntegrationService } from '../../../../core/services/github-integration.service';
import { GitHubIntegrationStateService } from '../../../../core/services/github-integration-state.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GitHubMetrics } from '../../../../core/models/interfaces';
import { Chart, registerables } from 'chart.js';
import { GitHubConnectPromptComponent } from '../../../../shared/components/github-connect-prompt/github-connect-prompt.component';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [CommonModule, GitHubConnectPromptComponent],
  templateUrl: './metrics-dashboard.component.html',
  styleUrls: ['./metrics-dashboard.component.scss']
})
export class MetricsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('commitTrendCanvas') commitTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('prStatusCanvas') prStatusCanvas!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private githubService = inject(GitHubIntegrationService);
  private integrationState = inject(GitHubIntegrationStateService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  integrationId = signal<string | null>(null);
  metrics = signal<GitHubMetrics | null>(null);
  loading = signal(false);
  noIntegration = signal(false);
  
  private commitTrendChart: Chart | null = null;
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
    this.noIntegration.set(false);
    
    console.log('[METRICS] Using centralized state service for integration check');
    
    // Use centralized state service
    this.integrationState.getIntegrationStatus(this.projectId()).subscribe({
      next: (integration) => {
        if (integration) {
          console.log('[METRICS] Integration found via state service:', integration.id);
          this.integrationId.set(integration.id);
          this.loadMetrics(integration.id);
        } else {
          console.log('[METRICS] No GitHub integration (from state service)');
          this.noIntegration.set(true);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[METRICS] Error from state service:', error);
        this.noIntegration.set(true);
        this.loading.set(false);
      }
    });
  }

  loadMetrics(integrationId: string): void {
    console.log('[METRICS] Loading metrics for integration:', integrationId);
    this.githubService.getMetrics(integrationId).subscribe({
      next: (metrics) => {
        console.log('[METRICS] Raw metrics received:', metrics);
        this.metrics.set(metrics);
        this.loading.set(false);
        // Initialize charts after view is ready
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        this.notificationService.error('Failed to load metrics');
        console.error('[METRICS] Error loading metrics:', error);
        this.loading.set(false);
      }
    });
  }

  initializeCharts(): void {
    const metrics = this.metrics();
    if (!metrics) return;

    this.createCommitTrendChart();
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

    // Parse commit_frequency (dict format from backend)
    let commitData: { date: string; count: number }[] = [];
    
    if (metrics.commit_frequency) {
      // Backend sends: { "2025-10-04": 5, "2025-10-05": 3, ... }
      commitData = Object.entries(metrics.commit_frequency)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log('[METRICS] Parsed commit_frequency:', commitData.length, 'data points');
    } else if (metrics.commit_activity) {
      // Fallback to legacy format
      commitData = metrics.commit_activity.map(a => ({ date: a.date, count: a.commits }));
    }

    if (commitData.length === 0) {
      console.warn('[METRICS] No commit data available for chart');
      return;
    }

    const labels = commitData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.commitTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Commits',
            data: commitData.map(item => item.count),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
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


  createPRStatusChart(): void {
    const metrics = this.metrics();
    if (!metrics || !this.prStatusCanvas) return;

    const ctx = this.prStatusCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (this.prStatusChart) {
      this.prStatusChart.destroy();
    }

    const totalPRs = metrics.total_pull_requests || 0;
    const openPRs = metrics.open_pull_requests || 0;
    const mergedPRs = metrics.merged_pull_requests || 0;
    const closedPRs = metrics.closed_pull_requests || (totalPRs - openPRs - mergedPRs);

    if (totalPRs === 0) {
      console.warn('[METRICS] No pull requests data available for chart');
      return;
    }

    console.log('[METRICS] PR status:', { open: openPRs, merged: mergedPRs, closed: closedPRs });

    this.prStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Open', 'Merged', 'Closed'],
        datasets: [{
          data: [openPRs, mergedPRs, closedPRs],
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
    if (this.prStatusChart) {
      this.prStatusChart.destroy();
    }
  }
}
