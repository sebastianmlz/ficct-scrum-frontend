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
  manualLoadRequired = signal(true); // User must click to load

  ngOnInit(): void {
    // ❌ NO AUTO-LOAD - User must explicitly request summary
    console.log('[AI-SUMMARY] Component initialized - waiting for user action');
  }

  async loadSummary(forceRefresh: boolean = false): Promise<void> {
    if (!this.issueId) {
      this.error.set('Issue ID is required');
      return;
    }

    console.log(`[AI-SUMMARY] User requested summary for ${this.issueId}`);
    this.loading.set(true);
    this.error.set(null);
    this.manualLoadRequired.set(false);

    try {
      const response = await this.aiService.getIssueSummary(this.issueId, forceRefresh).toPromise();

      if (response) {
        this.summary.set(response);
        console.log('[AI-SUMMARY] Summary loaded successfully');
      }
    } catch (err: any) {
      console.error('[AI-SUMMARY] Error loading summary:', err);
      this.error.set(err.error?.error || 'Failed to load issue summary.');
      this.manualLoadRequired.set(true); // Allow retry
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * User action: Generate AI summary
   */
  onGenerateSummary(): void {
    this.loadSummary(false);
  }
  
  /**
   * User action: Refresh summary
   */
  onRefreshSummary(): void {
    this.loadSummary(true);
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
