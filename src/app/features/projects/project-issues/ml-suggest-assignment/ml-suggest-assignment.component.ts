import {Component, Input, Output, EventEmitter, signal, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MlService, SuggestAssignmentResponse, AssignmentSuggestion} from '../../../../core/services/ml.service';
import {IssueService} from '../../../../core/services/issue.service';

@Component({
  selector: 'app-ml-suggest-assignment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-suggest-assignment.component.html',
})
export class MlSuggestAssignmentComponent implements OnInit {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  private mlService = inject(MlService);
  private issueService = inject(IssueService);

  loading = signal(false);
  assigning = signal(false);
  error = signal<string | null>(null);
  suggestions = signal<AssignmentSuggestion[]>([]);
  selectedSuggestion = signal<AssignmentSuggestion | null>(null);

  ngOnInit(): void {
    // Validar que tenemos los datos necesarios
    if (!this.issueId || !this.projectId) {
      this.error.set('Missing required information: issue ID and project ID are required');
      return;
    }
    this.getSuggestion();
  }

  async getSuggestion(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('[ML] Requesting assignment suggestion with:', {
        issue_id: this.issueId,
        project_id: this.projectId,
      });

      const result = await this.mlService.suggestAssignment({
        issue_id: this.issueId,
        project_id: this.projectId,
      }).toPromise();

      console.log('[ML] Assignment suggestion response:', result);

      // Verificar que la respuesta tenga datos válidos
      if (result && result.suggestions && result.suggestions.length > 0) {
        this.suggestions.set(result.suggestions);
        // Pre-select the top suggestion
        this.selectedSuggestion.set(result.suggestions[0]);
      } else {
        // Si no hay suggestions o la respuesta está vacía
        this.error.set('No team members available for assignment suggestion. The AI could not find suitable candidates for this task.');
      }
    } catch (error: any) {
      console.error('[ML Suggest Assignment] Error:', error);

      // Handle different error types
      if (error.message === 'Session expired') {
        // Auth interceptor already handled this
        return;
      }

      let errorMsg = 'Failed to get assignment suggestions';

      if (error.status === 0) {
        errorMsg = 'Connection lost. Please check your internet and try again.';
      } else if (error.status === 400) {
        errorMsg = error?.error?.error || 'Please provide valid issue details.';
      } else if (error.status === 404) {
        errorMsg = 'Issue or project not found. Please refresh and try again.';
      } else if (error.status === 500) {
        errorMsg = 'Assignment suggestion service temporarily unavailable. Please try again later.';
      } else {
        errorMsg = error?.error?.error || error?.error?.message || error?.message || errorMsg;
      }

      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  selectSuggestion(suggestion: AssignmentSuggestion): void {
    this.selectedSuggestion.set(suggestion);
  }

  async assignToSuggested(): Promise<void> {
    const selected = this.selectedSuggestion();
    if (!selected) return;

    this.assigning.set(true);

    try {
      // Usar el endpoint de asignación del IssueService
      await this.issueService.assignIssue(this.issueId).toPromise();
      this.assigned.emit();
      this.onClose();
    } catch (error: any) {
      console.error('Error assigning issue:', error);
      this.error.set(error?.error?.message || 'Failed to assign issue');
    } finally {
      this.assigning.set(false);
    }
  }

  getInitials(username: string): string {
    const parts = username.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  getMatchPercentage(score: number): number {
    return Math.round(score * 100);
  }

  getScoreColor(score: number): string {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  }

  onClose(): void {
    this.close.emit();
  }
}
