import {Component, Input, Output, EventEmitter, signal, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MlService, EstimateSprintDurationResponse} from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-estimate-sprint',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ml-estimate-sprint.component.html',
})
export class MlEstimateSprintComponent {
  @Input() sprintId!: string;
  @Output() close = new EventEmitter<void>();

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  estimate = signal<EstimateSprintDurationResponse | null>(null);

  scopeChangePercentage: number | null = null;
  teamCapacityHours: number | null = null;

  async estimateDuration(): Promise<void> {
    if (!this.sprintId) {
      this.error.set('Sprint ID is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const request: any = {
        sprint_id: this.sprintId,
      };

      if (this.scopeChangePercentage !== null && this.scopeChangePercentage > 0) {
        request.scope_change_percentage = this.scopeChangePercentage;
      }

      if (this.teamCapacityHours !== null && this.teamCapacityHours > 0) {
        request.team_capacity_hours = this.teamCapacityHours;
      }

      console.log('[ML Frontend] Requesting sprint duration estimate with:', request);

      const result = await this.mlService.estimateSprintDuration(request).toPromise();

      console.log('[ML Frontend] Sprint duration estimate received:', result);

      if (result) {
        this.estimate.set(result);
      } else {
        this.error.set('No estimation data received from server');
      }
    } catch (error: any) {
      console.error('[ML Frontend] Error estimating sprint duration:', error);

      // Mejorar manejo de errores según respuestas del backend
      const errorMsg = error?.error?.error || error?.error?.detail || error?.error?.message || error?.message || 'Failed to estimate sprint duration';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  resetForm(): void {
    this.estimate.set(null);
    this.error.set(null);
    this.scopeChangePercentage = null;
    this.teamCapacityHours = null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
