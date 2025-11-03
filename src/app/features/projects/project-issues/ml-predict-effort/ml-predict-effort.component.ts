import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlService, PredictEffortResponse } from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-predict-effort',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-predict-effort.component.html'
})
export class MlPredictEffortComponent {
  @Input() title!: string;
  @Input() description?: string;
  @Input() issueType!: string;
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() predictionApplied = new EventEmitter<number>(); // Solo emite horas

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  prediction = signal<PredictEffortResponse | null>(null);

  ngOnInit(): void {
    // Validar que tenemos los datos necesarios
    if (!this.title || !this.projectId || !this.issueType) {
      this.error.set('Missing required information: title, issue type, and project ID are required');
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
        project_id: this.projectId
      });

      const result = await this.mlService.predictEffort({
        title: this.title,
        description: this.description,
        issue_type: this.issueType,
        project_id: this.projectId
      }).toPromise();

      if (result) {
        this.prediction.set(result);
      }
    } catch (error: any) {
      console.error('Error predicting effort:', error);
      const errorMsg = error?.error?.error || error?.error?.message || error?.message || 'Failed to predict effort';
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
    this.close.emit();
  }
}
