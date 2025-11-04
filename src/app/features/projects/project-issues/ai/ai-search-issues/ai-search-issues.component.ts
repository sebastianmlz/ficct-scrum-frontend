import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, SearchResult } from '../../../../../core/services/ai.service';

@Component({
  selector: 'app-ai-search-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-search-issues.component.html',
  styleUrl: './ai-search-issues.component.css'
})
export class AiSearchIssuesComponent {
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() issueSelected = new EventEmitter<string>();

  private aiService = inject(AiService);
  private router = inject(Router);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  results = signal<SearchResult[]>([]);
  hasSearched = signal(false);

  async search(): Promise<void> {
    const query = this.searchQuery().trim();
    
    if (!query) {
      this.error.set('Please enter a search query');
      return;
    }

    if (!this.projectId) {
      this.error.set('Project ID is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    try {
      const response = await this.aiService.searchIssues({
        query,
        project_id: this.projectId,
        limit: 10
      }).toPromise();

      if (response) {
        this.results.set(response.results);
      }
    } catch (err: any) {
      console.error('Error searching issues:', err);
      this.error.set(err.error?.error || 'Failed to search issues. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectIssue(issueId: string): void {
    this.issueSelected.emit(issueId);
    this.onClose();
  }

  navigateToIssue(issueId: string): void {
    this.router.navigate(['/projects', this.projectId, 'issues', issueId]);
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search();
    }
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  }

  getScoreLabel(score: number): string {
    if (score >= 0.8) return 'High Match';
    if (score >= 0.6) return 'Medium Match';
    return 'Low Match';
  }
}
