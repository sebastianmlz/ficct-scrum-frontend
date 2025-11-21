import {Component, Input, OnInit, signal, inject, computed}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';
import {AiService, SprintSummaryResponse}
  from '../../../../core/services/ai.service';

@Component({
  selector: 'app-ai-sprint-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-sprint-summary.component.html',
  styleUrl: './ai-sprint-summary.component.css',
})
export class AiSprintSummaryComponent implements OnInit {
  @Input() sprintId!: string;

  private aiService = inject(AiService);
  private sanitizer = inject(DomSanitizer);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  summary = signal<SprintSummaryResponse | null>(null);
  manualLoadRequired = signal(true); // User must click to load

  // Computed: Convert Markdown to HTML
  formattedSummary = computed(() => {
    const summaryText = this.summary()?.summary;
    if (!summaryText) return '';

    // Simple Markdown to HTML conversion
    let html = summaryText
    // Headers
        .replace(/^#### (.*$)/gim,
            '<h4 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h4>')
        .replace(/^### (.*$)/gim,
            '<h3 class="text-lg font-bold text-gray-900 mt-5 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim,
            '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-4">$1</h2>')
    // Bold
        .replace(/\*\*(.*?)\*\*/gim,
            '<strong class="font-semibold text-gray-900">$1</strong>')
    // Lists
        .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    // Line breaks
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>');

    // Wrap in paragraph if needed
    if (!html.startsWith('<')) {
      html = `<p class="mb-3">${html}</p>`;
    }

    // Wrap list items
    html = html.replace(/(<li.*?<\/li>)+/g,
        '<ul class="list-disc list-inside space-y-1 mb-3">$&</ul>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  ngOnInit(): void {
    // ❌ NO AUTO-LOAD - User must explicitly request sprint summary
    console.log('[AI-SPRINT-SUMMARY] Component initialized -' +
      ' waiting for user action');
  }

  async loadSummary(forceRefresh = false): Promise<void> {
    if (!this.sprintId) {
      this.error.set('Sprint ID is required');
      return;
    }

    console.log(`[AI-SPRINT-SUMMARY] User requested summary for sprint ` +
      `${this.sprintId}`);
    this.loading.set(true);
    this.error.set(null);
    this.manualLoadRequired.set(false);

    try {
      const response = await this.aiService
          .getSprintSummary(this.sprintId, forceRefresh).toPromise();

      if (response) {
        this.summary.set(response);
        console.log('[AI-SPRINT-SUMMARY] Summary loaded successfully');
      }
    } catch (err: any) {
      console.error('[AI-SPRINT-SUMMARY] Error loading summary:', err);
      this.error.set(err.error?.error || 'Failed to load sprint summary.');
      this.manualLoadRequired.set(true); // Allow retry
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * User action: Generate sprint summary
   */
  onGenerateSummary(): void {
    this.loadSummary(false);
  }

  async refresh(): Promise<void> {
    await this.loadSummary(true);
  }
}
