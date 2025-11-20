import {Component, Input, signal, inject, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MlService, SprintRisk} from '../../../../core/services/ml.service';
import {interval, Subscription} from 'rxjs';

@Component({
  selector: 'app-sprint-risk-detection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sprint-risk-detection.component.html',
  styleUrl: './sprint-risk-detection.component.css',
})
export class SprintRiskDetectionComponent implements OnInit, OnDestroy {
  @Input() sprintId!: string;
  @Input() autoRefresh = true; // Auto-refresh every 15 minutes

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  risks = signal<SprintRisk[]>([]);
  expanded = signal(false);

  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

  ngOnInit(): void {
    if (!this.sprintId) {
      this.error.set('Sprint ID is required');
      return;
    }

    // Initial load
    this.loadRisks();

    // Set up auto-refresh if enabled
    if (this.autoRefresh) {
      this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
        this.loadRisks();
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  async loadRisks(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[Sprint Risk] Loading risks for sprint:', this.sprintId);

      const result = await this.mlService.getSprintRisk(this.sprintId).toPromise();

      if (result) {
        this.risks.set(result.risks || []);
        console.log('[Sprint Risk] Loaded risks:', result.risks.length);
      }
    } catch (error: any) {
      console.error('[Sprint Risk] Error:', error);

      // Handle different error types
      if (error.message === 'Session expired') {
        return;
      }

      let errorMsg = 'Failed to load sprint risks';

      if (error.status === 0) {
        errorMsg = 'Connection lost. Check your internet and try again.';
      } else if (error.status === 404) {
        errorMsg = 'Sprint not found.';
      } else if (error.status === 500) {
        errorMsg = 'Risk detection temporarily unavailable.';
      } else {
        errorMsg = error?.error?.error || error?.error?.message || error?.message || errorMsg;
      }

      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  toggleExpanded(): void {
    this.expanded.update((val) => !val);
  }

  getRiskCount(): number {
    return this.risks().length;
  }

  getHighSeverityCount(): number {
    return this.risks().filter((r) => r.severity === 'high').length;
  }

  getMediumSeverityCount(): number {
    return this.risks().filter((r) => r.severity === 'medium').length;
  }

  getLowSeverityCount(): number {
    return this.risks().filter((r) => r.severity === 'low').length;
  }

  getHighestSeverity(): 'high' | 'medium' | 'low' | null {
    const risks = this.risks();
    if (risks.length === 0) return null;
    if (risks.some((r) => r.severity === 'high')) return 'high';
    if (risks.some((r) => r.severity === 'medium')) return 'medium';
    return 'low';
  }

  getSeverityBadgeClass(): string {
    const severity = this.getHighestSeverity();
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
      default: return '⚪';
    }
  }

  retryLoad(): void {
    this.loadRisks();
  }
}
