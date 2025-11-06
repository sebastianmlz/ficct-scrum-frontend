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

    console.log('[AI SEARCH] Starting search for query:', query);
    console.log('[AI SEARCH] Project ID:', this.projectId);
    
    try {
      const response = await this.aiService.searchIssues({
        query,
        project_id: this.projectId,
        top_k: 10
      }).toPromise();

      if (response) {
        console.log('[AI SEARCH] ✅ Search successful, results:', response.results.length);
        console.log('[AI SEARCH] Sample metadata:', response.results[0]?.metadata);
        this.results.set(response.results);
      }
    } catch (err: any) {
      console.error('[AI SEARCH] ❌ Search error:', err);
      this.error.set(err.error?.error || 'Failed to search issues. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectIssue(issueId: string): void {
    console.log('[AI SEARCH] Issue selected:', issueId);
    this.issueSelected.emit(issueId);
    this.onClose();
  }

  navigateToIssue(issueId: string): void {
    console.log('[AI SEARCH] Navigating to issue:', issueId);
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

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }
  
  /**
   * Get priority color class for badge
   */
  getPriorityColor(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'P1':
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'P2':
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'P3':
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P4':
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  /**
   * Get status color class for badge
   */
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'to do':
      case 'todo':
      case 'open':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  }
  
  /**
   * Check if assignee is unassigned (sanitized value)
   */
  isUnassigned(assigneeName: string): boolean {
    return !assigneeName || assigneeName.toLowerCase() === 'unassigned';
  }
  
  /**
   * Check if reporter is unknown (sanitized value)
   */
  isUnknownReporter(reporterName: string): boolean {
    return !reporterName || reporterName.toLowerCase() === 'unknown';
  }
}
