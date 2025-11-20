import { Component, Input, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlService, ProjectSummaryResponse } from '../../../../core/services/ml.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-project-ml-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-ml-summary.component.html',
  styleUrl: './project-ml-summary.component.css'
})
export class ProjectMlSummaryComponent implements OnInit, OnDestroy {
  @Input() projectId!: string;
  @Input() autoRefresh = true; // Auto-refresh every 5 minutes
  
  private mlService = inject(MlService);
  
  loading = signal(false);
  error = signal<string | null>(null);
  summary = signal<ProjectSummaryResponse | null>(null);
  
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  ngOnInit(): void {
    if (!this.projectId) {
      this.error.set('Project ID is required');
      return;
    }
    
    // Initial load
    this.loadSummary();
    
    // Set up auto-refresh if enabled
    if (this.autoRefresh) {
      this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
        this.loadSummary();
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  async loadSummary(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[Project Summary] Loading summary for project:', this.projectId);
      
      const result = await this.mlService.getProjectSummary(this.projectId).toPromise();
      
      if (result) {
        this.summary.set(result);
        console.log('[Project Summary] Loaded:', result);
      }
    } catch (error: any) {
      console.error('[Project Summary] Error:', error);
      
      // Handle different error types
      if (error.message === 'Session expired') {
        return;
      }
      
      let errorMsg = 'Failed to load project summary';
      
      if (error.status === 0) {
        errorMsg = 'Connection lost. Check your internet and try again.';
      } else if (error.status === 404) {
        errorMsg = 'Project not found.';
      } else if (error.status === 500) {
        errorMsg = 'Summary service temporarily unavailable.';
      } else {
        errorMsg = error?.error?.error || error?.error?.message || error?.message || errorMsg;
      }
      
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  getRiskScoreClass(): string {
    const score = this.summary()?.risk_score || 0;
    if (score < 40) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getRiskScoreBgClass(): string {
    const score = this.summary()?.risk_score || 0;
    if (score < 40) return 'bg-green-100 border-green-300';
    if (score < 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  }

  getRiskLabel(): string {
    const score = this.summary()?.risk_score || 0;
    if (score < 40) return 'Healthy';
    if (score < 70) return 'Caution';
    return 'Critical';
  }

  getCompletionClass(): string {
    const completion = this.summary()?.completion || 0;
    if (completion < 30) return 'text-red-600';
    if (completion < 70) return 'text-yellow-600';
    return 'text-green-600';
  }

  retryLoad(): void {
    this.loadSummary();
  }

  manualRefresh(): void {
    // Clear cache and reload
    this.mlService.clearProjectCache(this.projectId);
    this.loadSummary();
  }
}
