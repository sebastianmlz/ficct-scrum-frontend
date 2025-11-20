import {Component, Input, OnInit, signal, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {AiService, SimilarIssue} from '../../../../../core/services/ai.service';

@Component({
  selector: 'app-ai-similar-issues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-similar-issues.component.html',
  styleUrl: './ai-similar-issues.component.css',
})
export class AiSimilarIssuesComponent implements OnInit {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Input() limit = 5;

  private aiService = inject(AiService);
  private router = inject(Router);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  similarIssues = signal<SimilarIssue[]>([]);
  manualLoadRequired = signal(true); // User must click to load

  ngOnInit(): void {
    // ❌ NO AUTO-LOAD - User must explicitly request similar issues
    console.log('[AI-SIMILAR] Component initialized - waiting for user action');
  }

  async loadSimilarIssues(): Promise<void> {
    if (!this.issueId) {
      this.error.set('Issue ID is required');
      return;
    }

    console.log(`[AI-SIMILAR] User requested similar issues for ${this.issueId}`);
    this.loading.set(true);
    this.error.set(null);
    this.manualLoadRequired.set(false);

    try {
      const response = await this.aiService.findSimilar(this.issueId, this.limit).toPromise();
      if (response && Array.isArray(response.similar_issues)) {
        this.similarIssues.set(response.similar_issues);
        console.log(`[AI-SIMILAR] Found ${response.similar_issues.length} similar issues`);
      } else {
        this.similarIssues.set([]);
      }
    } catch (err: any) {
      console.error('[AI-SIMILAR] Error loading similar issues:', err);
      this.error.set(err.error?.error || 'Failed to load similar issues.');
      this.similarIssues.set([]);
      this.manualLoadRequired.set(true); // Allow retry
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * User action: Find similar issues
   */
  onFindSimilar(): void {
    this.loadSimilarIssues();
  }

  navigateToIssue(issueId: string): void {
    this.router.navigate(['/projects', this.projectId, 'issues', issueId]);
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return 'bg-green-100 text-green-700';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  }

  getScoreLabel(score: number): string {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  }
}
