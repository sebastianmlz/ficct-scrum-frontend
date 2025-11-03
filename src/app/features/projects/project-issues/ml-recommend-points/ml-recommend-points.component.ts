import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlService, RecommendStoryPointsResponse } from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-recommend-points',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-recommend-points.component.html'
})
export class MlRecommendPointsComponent {
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
        project_id: this.projectId
      });

      const result = await this.mlService.recommendStoryPoints({
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId
      }).toPromise();

      if (result) {
        this.recommendation.set(result);
      }
    } catch (error: any) {
      console.error('Error recommending points:', error);
      const errorMsg = error?.error?.error || error?.error?.message || error?.message || 'Failed to recommend story points';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  getStars(points: number): number[] {
    return Array(Math.min(points, 13)).fill(0);
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
