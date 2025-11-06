import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService, SyncAllResponse, SyncError } from '../../../core/services/ai.service';
import { interval, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sync-pinecone-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-pinecone-manager.component.html',
  styleUrl: './sync-pinecone-manager.component.css'
})
export class SyncPineconeManagerComponent implements OnDestroy {
  private aiService = inject(AiService);
  private destroy$ = new Subject<void>();

  // State
  syncing = signal(false);
  syncResult = signal<SyncAllResponse | null>(null);
  error = signal<string | null>(null);
  elapsedSeconds = signal(0);
  loadingMessage = signal('Initializing sync...');
  showConfirmDialog = signal(false);

  // Loading message rotation
  private loadingMessages = [
    'Clearing Pinecone vectors...',
    'Processing projects...',
    'Indexing issues...',
    'Generating embeddings...',
    'Syncing metadata...',
    'Almost done, this may take up to 10 minutes...',
    'Still processing, please wait...'
  ];
  private currentMessageIndex = 0;

  /**
   * Show confirmation dialog before triggering sync
   */
  confirmSync(): void {
    console.log('[SYNC MANAGER] Opening confirmation dialog');
    this.showConfirmDialog.set(true);
  }

  /**
   * Cancel sync confirmation
   */
  cancelSync(): void {
    console.log('[SYNC MANAGER] Sync canceled by user');
    this.showConfirmDialog.set(false);
  }

  /**
   * Start full Pinecone sync operation
   * DESTRUCTIVE: Clears all vectors and re-indexes everything
   */
  async startFullSync(): Promise<void> {
    console.log('[SYNC MANAGER] 🚨 Starting FULL SYNC operation');
    console.log('[SYNC MANAGER] Expected duration: 5-10 minutes');
    
    this.showConfirmDialog.set(false);
    this.syncing.set(true);
    this.syncResult.set(null);
    this.error.set(null);
    this.elapsedSeconds.set(0);
    this.currentMessageIndex = 0;
    this.loadingMessage.set(this.loadingMessages[0]);

    // Start elapsed time counter
    this.startElapsedTimer();
    
    // Start rotating loading messages
    this.startLoadingMessageRotation();

    try {
      const startTime = Date.now();
      console.log('[SYNC MANAGER] Calling syncAllPinecone(true)...');
      
      const result = await this.aiService.syncAllPinecone(true).toPromise();
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('[SYNC MANAGER] ✅ Sync completed in', elapsed, 'seconds');
      console.log('[SYNC MANAGER] Result:', result);

      if (result) {
        this.syncResult.set(result);
        
        if (result.status === 'success' && result.success_rate === 100) {
          console.log('[SYNC MANAGER] 🎉 Perfect sync! 100% success rate');
        } else if (result.status === 'partial' || result.success_rate < 100) {
          console.warn('[SYNC MANAGER] ⚠️ Partial sync:', result.success_rate + '%');
          console.warn('[SYNC MANAGER] Failed:', result.failed, 'Errors:', result.total_errors);
        }
      }
    } catch (err: any) {
      const elapsed = this.elapsedSeconds();
      console.error('[SYNC MANAGER] ❌ Sync failed after', elapsed, 'seconds:', err);
      
      let errorMessage = 'Failed to sync Pinecone. Please try again.';
      
      if (err.name === 'TimeoutError' || err.status === 408) {
        errorMessage = 'Sync operation took longer than 10 minutes. Check backend logs for status.';
        console.error('[SYNC MANAGER] ⏱️ TIMEOUT - Operation exceeded 600 seconds');
      } else if (err.status === 401 || err.status === 403) {
        errorMessage = 'You do not have permission to sync Pinecone. Admin access required.';
      } else if (err.status === 500) {
        errorMessage = 'Backend error occurred. Please check server logs and try again later.';
      } else if (err.status === 0) {
        errorMessage = 'Network connection lost. Please check your connection and try again.';
      } else if (err.error?.detail) {
        errorMessage = err.error.detail;
      }
      
      this.error.set(errorMessage);
    } finally {
      this.syncing.set(false);
    }
  }

  /**
   * Start elapsed time counter (updates every second)
   */
  private startElapsedTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.syncing()) {
          this.elapsedSeconds.update(s => s + 1);
        }
      });
  }

  /**
   * Start rotating loading messages every 5 seconds
   */
  private startLoadingMessageRotation(): void {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.syncing()) {
          this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
          this.loadingMessage.set(this.loadingMessages[this.currentMessageIndex]);
          console.log('[SYNC MANAGER] 🔄 Loading message updated:', this.loadingMessages[this.currentMessageIndex]);
        }
      });
  }

  /**
   * Format elapsed time as MM:SS
   */
  getFormattedTime(): string {
    const seconds = this.elapsedSeconds();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get color class for success rate
   */
  getSuccessRateColor(rate: number): string {
    if (rate === 100) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Get first 5 errors for display
   */
  getDisplayErrors(): SyncError[] {
    const result = this.syncResult();
    if (!result || !result.errors) return [];
    return result.errors.slice(0, 5);
  }

  /**
   * Check if there are more errors than displayed
   */
  hasMoreErrors(): boolean {
    const result = this.syncResult();
    return result ? result.total_errors > 5 : false;
  }

  /**
   * Get remaining error count
   */
  getRemainingErrorsCount(): number {
    const result = this.syncResult();
    return result ? result.total_errors - 5 : 0;
  }

  /**
   * Retry sync on error
   */
  retrySync(): void {
    console.log('[SYNC MANAGER] Retrying sync...');
    this.error.set(null);
    this.confirmSync();
  }

  /**
   * Clear results to start fresh
   */
  clearResults(): void {
    console.log('[SYNC MANAGER] Clearing results');
    this.syncResult.set(null);
    this.error.set(null);
    this.elapsedSeconds.set(0);
  }

  ngOnDestroy(): void {
    console.log('[SYNC MANAGER] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
