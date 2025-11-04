import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService, IssueSummaryResponse } from '../../../../../core/services/ai.service';

@Component({
  selector: 'app-ai-issue-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-issue-summary.component.html',
  styleUrl: './ai-issue-summary.component.css'
})
export class AiIssueSummaryComponent implements OnInit {
  @Input() issueId!: string;

  private aiService = inject(AiService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  summary = signal<IssueSummaryResponse | null>(null);

  ngOnInit(): void {
    if (this.issueId) {
      this.loadSummary();
    }
  }

  async loadSummary(): Promise<void> {
    if (!this.issueId) {
      this.error.set('Issue ID is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.aiService.getIssueSummary(this.issueId).toPromise();

      if (response) {
        this.summary.set(response);
      }
    } catch (err: any) {
      console.error('Error loading issue summary:', err);
      this.error.set(err.error?.error || 'Failed to load issue summary.');
    } finally {
      this.loading.set(false);
    }
  }

  getComplexityColor(complexity?: string): string {
    if (!complexity) return 'bg-gray-100 text-gray-700';
    switch (complexity.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getComplexityIcon(complexity?: string): string {
    if (!complexity) return '⚪';
    switch (complexity.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  }
}
