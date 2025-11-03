import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, retry, delay } from 'rxjs/operators';
import { GitHubIntegration } from '../models/interfaces';
import { GitHubIntegrationService } from './github-integration.service';

/**
 * Cached integration data with timestamp for TTL management
 */
interface CachedIntegration {
  integration: GitHubIntegration | null;
  timestamp: number;
  loading: boolean;
}

/**
 * Centralized state management service for GitHub integrations
 * Provides caching, single source of truth, and eliminates duplicate API calls
 */
@Injectable({
  providedIn: 'root'
})
export class GitHubIntegrationStateService {
  private githubService = inject(GitHubIntegrationService);
  
  // Cache TTL: 5 minutes
  private readonly CACHE_TTL = 5 * 60 * 1000; // 300000ms
  
  // In-memory cache: Map<projectId, CachedIntegration>
  private cache = new Map<string, BehaviorSubject<CachedIntegration>>();

  constructor() {
    console.log('[INTEGRATION STATE] Service initialized');
  }

  /**
   * Get integration status for a project
   * Uses cache if available and not expired, otherwise fetches from API
   */
  getIntegrationStatus(projectId: string): Observable<GitHubIntegration | null> {
    console.log('[INTEGRATION STATE] Getting integration for project:', projectId);
    
    // Get or create cache entry for this project
    if (!this.cache.has(projectId)) {
      this.cache.set(projectId, new BehaviorSubject<CachedIntegration>({
        integration: null,
        timestamp: 0,
        loading: false
      }));
    }

    const cached$ = this.cache.get(projectId)!;
    const cached = cached$.value;

    // Check if cache is valid
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > this.CACHE_TTL;

    if (cached.integration !== null && !isExpired && !cached.loading) {
      console.log('[INTEGRATION STATE] Returning cached integration (age:', Math.round((now - cached.timestamp) / 1000), 'seconds)');
      return of(cached.integration);
    }

    if (cached.loading) {
      console.log('[INTEGRATION STATE] Request already in flight, waiting...');
      return cached$.pipe(
        map(c => c.integration)
      );
    }

    // Need to fetch from API
    console.log('[INTEGRATION STATE] Cache miss or expired, fetching from API');
    return this.fetchIntegrationStatus(projectId);
  }

  /**
   * Force refresh integration status, bypassing cache
   */
  refreshIntegrationStatus(projectId: string): Observable<GitHubIntegration | null> {
    console.log('[INTEGRATION STATE] Force refreshing integration for project:', projectId);
    return this.fetchIntegrationStatus(projectId);
  }

  /**
   * Check if project has integration (returns boolean observable)
   */
  hasIntegration$(projectId: string): Observable<boolean> {
    return this.getIntegrationStatus(projectId).pipe(
      map(integration => integration !== null)
    );
  }

  /**
   * Check if currently loading integration status
   */
  isLoading$(projectId: string): Observable<boolean> {
    if (!this.cache.has(projectId)) {
      return of(false);
    }
    
    return this.cache.get(projectId)!.pipe(
      map(cached => cached.loading)
    );
  }

  /**
   * Clear cache for specific project or all projects
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      console.log('[INTEGRATION STATE] Clearing cache for project:', projectId);
      if (this.cache.has(projectId)) {
        const cached$ = this.cache.get(projectId)!;
        cached$.next({
          integration: null,
          timestamp: 0,
          loading: false
        });
      }
    } else {
      console.log('[INTEGRATION STATE] Clearing all cache');
      this.cache.forEach((cached$, key) => {
        cached$.next({
          integration: null,
          timestamp: 0,
          loading: false
        });
      });
    }
  }

  /**
   * Internal method to fetch integration from API and update cache
   */
  private fetchIntegrationStatus(projectId: string): Observable<GitHubIntegration | null> {
    const cached$ = this.cache.get(projectId) || new BehaviorSubject<CachedIntegration>({
      integration: null,
      timestamp: 0,
      loading: false
    });

    if (!this.cache.has(projectId)) {
      this.cache.set(projectId, cached$);
    }

    // Set loading state
    cached$.next({
      ...cached$.value,
      loading: true
    });

    return this.githubService.getIntegrations({ project: projectId }).pipe(
      // Retry on network errors with exponential backoff
      retry({
        count: 3,
        delay: (error, retryCount) => {
          console.warn(`[INTEGRATION STATE] Retry attempt ${retryCount} after error:`, error);
          return of(null).pipe(delay(1000 * Math.pow(2, retryCount - 1)));
        }
      }),
      map(response => {
        const integration = response.results && response.results.length > 0 ? response.results[0] : null;
        console.log('[INTEGRATION STATE] Integration fetched:', integration ? 'found' : 'not found');
        
        // Update cache
        cached$.next({
          integration,
          timestamp: Date.now(),
          loading: false
        });
        
        return integration;
      }),
      catchError(error => {
        console.error('[INTEGRATION STATE] Error fetching integration:', error);
        
        // Handle specific error codes
        if (error.status === 404 || error.status === 403) {
          // Not found or forbidden - treat as no integration
          cached$.next({
            integration: null,
            timestamp: Date.now(),
            loading: false
          });
          return of(null);
        }
        
        // For other errors, don't cache and mark as not loading
        cached$.next({
          ...cached$.value,
          loading: false
        });
        
        return throwError(() => error);
      }),
      tap(integration => {
        // Emit final state to cache
        cached$.next({
          integration,
          timestamp: Date.now(),
          loading: false
        });
      })
    );
  }

  /**
   * Get current cached integration synchronously (if exists)
   * Returns null if no cache entry or cache is expired
   */
  getCurrentIntegration(projectId: string): GitHubIntegration | null {
    if (!this.cache.has(projectId)) {
      return null;
    }

    const cached = this.cache.get(projectId)!.value;
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > this.CACHE_TTL;

    if (isExpired) {
      return null;
    }

    return cached.integration;
  }

  /**
   * Manually update cache (useful after creating/deleting integration)
   */
  updateCache(projectId: string, integration: GitHubIntegration | null): void {
    console.log('[INTEGRATION STATE] Manually updating cache for project:', projectId);
    
    if (!this.cache.has(projectId)) {
      this.cache.set(projectId, new BehaviorSubject<CachedIntegration>({
        integration,
        timestamp: Date.now(),
        loading: false
      }));
    } else {
      this.cache.get(projectId)!.next({
        integration,
        timestamp: Date.now(),
        loading: false
      });
    }
  }
}
