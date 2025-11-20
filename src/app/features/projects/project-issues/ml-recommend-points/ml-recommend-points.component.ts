import {Component, Input, Output, EventEmitter, signal, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MlService, RecommendStoryPointsResponse} from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-recommend-points',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-recommend-points.component.html',
})
export class MlRecommendPointsComponent implements OnInit {
  @Input() title!: string;
  @Input() description?: string;
  @Input() issueType!: string;
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() pointsRecommended = new EventEmitter<number>();

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  recommendation = signal<RecommendStoryPointsResponse | null>(null);

  ngOnInit(): void {
    // Validar que tenemos los datos necesarios
    if (!this.title || !this.projectId || !this.issueType) {
      this.error.set('Missing required information: title, issue type, and project ID are required');
      return;
    }
    this.recommendPoints();
  }

  async recommendPoints(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[ML] Requesting story points recommendation with:', {
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId,
      });

      const result = await this.mlService.recommendStoryPoints({
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId,
      }).toPromise();

      if (result) {
        this.recommendation.set(result);
      }
    } catch (error: any) {
      console.error('[ML Recommend Points] Error:', error);

      // Handle different error types
      if (error.message === 'Session expired') {
        // Auth interceptor already handled this
        return;
      }

      let errorMsg = 'Failed to recommend story points';

      if (error.status === 0) {
        errorMsg = 'Connection lost. Please check your internet and try again.';
      } else if (error.status === 400) {
        errorMsg = error?.error?.error || 'Please provide valid issue details.';
      } else if (error.status === 404) {
        errorMsg = 'Project not found. Please refresh and try again.';
      } else if (error.status === 500) {
        errorMsg = 'Prediction service temporarily unavailable. Please try again later.';
      } else {
        errorMsg = error?.error?.error || error?.error?.message || error?.message || errorMsg;
      }

      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  getStars(points: number): number[] {
    return Array(Math.min(points, 13)).fill(0);
  }

  getDistributionKeys(): string[] {
    const rec = this.recommendation();
    if (!rec || !rec.probability_distribution) {
      return [];
    }
    // Sort by story points value (Fibonacci sequence)
    return Object.keys(rec.probability_distribution)
        .map((k) => parseInt(k))
        .sort((a, b) => a - b)
        .map((k) => k.toString());
  }

  applyRecommendation(): void {
    const rec = this.recommendation();
    if (rec) {
      this.pointsRecommended.emit(rec.recommended_points);
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
