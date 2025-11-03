import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlService, SuggestAssignmentResponse } from '../../../../core/services/ml.service';
import { IssueService } from '../../../../core/services/issue.service';

@Component({
  selector: 'app-ml-suggest-assignment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-suggest-assignment.component.html'
})
export class MlSuggestAssignmentComponent {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  private mlService = inject(MlService);
  private issueService = inject(IssueService);

  loading = signal(false);
  assigning = signal(false);
  error = signal<string | null>(null);
  suggestion = signal<SuggestAssignmentResponse | null>(null);

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
        project_id: this.projectId
      });

      const result = await this.mlService.suggestAssignment({
        issue_id: this.issueId,
        project_id: this.projectId
      }).toPromise();

      console.log('[ML] Assignment suggestion response:', result);

      // Verificar que la respuesta tenga datos válidos
      if (result && result.suggested_assignee && result.suggested_assignee.id) {
        this.suggestion.set(result);
      } else {
        // Si no hay suggested_assignee o la respuesta está vacía
        this.error.set('No team members available for assignment suggestion. The AI could not find suitable candidates for this task.');
      }
    } catch (error: any) {
      console.error('Error getting assignment suggestion:', error);
      const errorMsg = error?.error?.error || error?.error?.message || error?.message || 'Failed to get assignment suggestion';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  async assignToSuggested(): Promise<void> {
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

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  onClose(): void {
    this.close.emit();
  }
}
