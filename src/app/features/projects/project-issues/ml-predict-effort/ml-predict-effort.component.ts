import {Component, Input, Output, EventEmitter, signal, inject, OnInit}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {MlService, PredictEffortResponse}
  from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-predict-effort',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-predict-effort.component.html',
})
export class MlPredictEffortComponent implements OnInit {
  @Input() title!: string;
  @Input() description?: string;
  @Input() issueType!: string;
  @Input() projectId!: string;
  @Output() closeE = new EventEmitter<void>();
  @Output() predictionApplied = new EventEmitter<number>(); // Solo emite horas

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  prediction = signal<PredictEffortResponse | null>(null);

  ngOnInit(): void {
    // Validar que tenemos los datos necesarios
    if (!this.title || !this.projectId || !this.issueType) {
      this.error.set('Missing required information: title, ' +
        'issue type, and project ID are required');
      return;
    }
    this.predictEffort();
  }

  async predictEffort(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[ML] Requesting effort prediction with:', {
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId,
      });

      const result = await this.mlService.predictEffort({
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId,
      }).toPromise();

      if (result) {
        this.prediction.set(result);
      }
    } catch (error: any) {
      console.error('[ML Predict Effort] Error:', error);

      // Handle different error types
      if (error.message === 'Session expired') {
        // Auth interceptor already handled this
        return;
      }

      let errorMsg = 'Failed to predict effort';

      if (error.status === 0) {
        errorMsg = 'Connection lost. Please check your internet and try again.';
      } else if (error.status === 400) {
        errorMsg = error?.error?.error || 'Please provide valid issue details.';
      } else if (error.status === 404) {
        errorMsg = 'Project not found. Please refresh and try again.';
      } else if (error.status === 500) {
        errorMsg = 'Prediction service temporarily unavailable. ' +
        'Please try again later.';
      } else {
        errorMsg = error?.error?.error || error?.error?.message ||
        error?.message || errorMsg;
      }

      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  applyPrediction(): void {
    const pred = this.prediction();
    if (pred) {
      this.predictionApplied.emit(pred.predicted_hours);
      this.onClose();
    }
  }

  onClose(): void {
    this.closeE.emit();
  }
}
