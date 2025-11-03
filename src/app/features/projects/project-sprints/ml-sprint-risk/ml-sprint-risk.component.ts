import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlService, SprintRisk } from '../../../../core/services/ml.service';

@Component({
  selector: 'app-ml-sprint-risk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-sprint-risk.component.html'
})
export class MlSprintRiskComponent {
  @Input() sprintId!: string;
  @Output() close = new EventEmitter<void>();

  private mlService = inject(MlService);

  loading = signal(false);
  error = signal<string | null>(null);
  risks = signal<SprintRisk[] | null>(null);

  ngOnInit(): void {
    if (!this.sprintId) {
      this.error.set('Sprint ID is required');
      return;
    }
    this.loadRisks();
  }

  async loadRisks(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[ML Frontend] Requesting sprint risk assessment for:', this.sprintId);

      const result = await this.mlService.getSprintRisk(this.sprintId).toPromise();

      console.log('[ML Frontend] Sprint risk assessment received:', result);

      if (result && result.risks) {
        this.risks.set(result.risks);
      } else {
        // Si no hay risks, establecer array vacío
        this.risks.set([]);
      }
    } catch (error: any) {
      console.error('[ML Frontend] Error loading sprint risks:', error);
      
      // Mejorar manejo de errores según respuestas del backend
      const errorMsg = error?.error?.error || error?.error?.detail || error?.error?.message || error?.message || 'Failed to load sprint risk assessment';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  formatRiskType(riskType: string): string {
    const typeMap: Record<string, string> = {
      'scope_creep': 'Scope Creep',
      'velocity': 'Velocity Issues',
      'complexity': 'High Complexity',
      'resource': 'Resource Constraints',
      'timeline': 'Timeline Pressure',
      'dependency': 'External Dependencies',
      'technical_debt': 'Technical Debt'
    };
    return typeMap[riskType] || riskType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  onClose(): void {
    this.close.emit();
  }
}
