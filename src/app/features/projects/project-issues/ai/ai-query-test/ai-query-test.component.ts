import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AIQueryResponse, AISource } from '../../../../../core/services/ai.service';
import { RouterModule } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-ai-query-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-query-test.component.html',
  styleUrl: './ai-query-test.component.css'
})
export class AiQueryTestComponent implements OnDestroy {
  private aiService = inject(AiService);
  private destroy$ = new Subject<void>();

  // State
  queryInput = signal('');
  loading = signal(false);
  loadingMessage = signal('Analyzing your query...');
  error = signal<string | null>(null);
  answer = signal<string | null>(null);
  sources = signal<AISource[]>([]);
  
  // Loading message rotation for long-running queries
  private loadingMessages = [
    'Analyzing your query...',
    'Searching project data...',
    'Running AI reasoning...', // O-series specific
    'Generating detailed response...',
    'Still processing, this may take up to 45 seconds for complex analysis'
  ];
  private currentMessageIndex = 0;

  // Sample queries
  sampleQueries = [
    '¿Qué tasks hay pendientes?',
    '¿Cuáles son los issues de alta prioridad?',
    'Muestra los bugs sin asignar',
    'Resume el estado del proyecto'
  ];

  sendQuery(): void {
    const query = this.queryInput().trim();
    
    if (!query || this.loading()) return;

    console.log('[AI QUERY TEST] User submitted query:', query);
    console.log('[AI QUERY TEST] Note: O4-mini may take 10-45 seconds due to reasoning tokens');
    
    this.loading.set(true);
    this.error.set(null);
    this.answer.set(null);
    this.sources.set([]);
    this.currentMessageIndex = 0;
    this.loadingMessage.set(this.loadingMessages[0]);
    
    // Start rotating loading messages every 3 seconds
    this.startLoadingMessageRotation();

    this.aiService.query(query).subscribe({
      next: (response: AIQueryResponse) => {
        console.log('[AI QUERY TEST] ✅ Query successful!');
        console.log('[AI QUERY TEST] Answer:', response.answer);
        console.log('[AI QUERY TEST] Sources count:', response.sources?.length || 0);
        console.log('[AI QUERY TEST] Sources:', response.sources);
        
        this.answer.set(response.answer);
        this.sources.set(response.sources || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[AI QUERY TEST] ❌ Query failed:', err);
        console.error('[AI QUERY TEST] Error name:', err.name);
        console.error('[AI QUERY TEST] Status:', err.status);
        console.error('[AI QUERY TEST] Error body:', err.error);
        
        let errorMessage = 'Failed to get AI response. Please try again.';
        
        // Handle timeout errors specially (O4-mini can take long)
        if (err.name === 'TimeoutError' || err.status === 408) {
          errorMessage = err.message || 'Query took longer than expected. The AI model may be processing complex reasoning. Try a simpler question or try again later.';
          console.warn('[AI QUERY TEST] ⏱️ Timeout occurred - this is normal for very complex queries');
        } else if (err.status === 500) {
          errorMessage = 'AI service temporarily unavailable. Please try again later.';
        } else if (err.status === 400) {
          // Model mismatch or unsupported parameter
          if (err.error?.error?.includes('parameter') || err.error?.error?.includes('model')) {
            errorMessage = 'This query is not supported by the current AI model configuration.';
          } else {
            errorMessage = err.error?.error || 'Invalid query format.';
          }
        } else if (err.status === 0) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }
  
  /**
   * Start rotating loading messages every 3 seconds
   * Helps user understand progress during long O4-mini reasoning
   */
  private startLoadingMessageRotation(): void {
    interval(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.loading()) {
          this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
          this.loadingMessage.set(this.loadingMessages[this.currentMessageIndex]);
          console.log('[AI QUERY TEST] 🔄 Loading message updated:', this.loadingMessages[this.currentMessageIndex]);
        }
      });
  }

  useSampleQuery(query: string): void {
    this.queryInput.set(query);
  }

  clearQuery(): void {
    this.queryInput.set('');
    this.answer.set(null);
    this.sources.set([]);
    this.error.set(null);
  }

  retry(): void {
    this.sendQuery();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendQuery();
    }
  }

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }

  getScoreClass(score: number): string {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
