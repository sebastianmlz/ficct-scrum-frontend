import {HttpInterceptorFn, HttpRequest, HttpResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {of, throwError} from 'rxjs';
import {tap, catchError} from 'rxjs/operators';

/**
 * AI Deduplication Interceptor
 * Prevents duplicate AI requests within a time window
 *
 * Strategy:
 * - Tracks requests by hash(url + params)
 * - If same request made within DEDUP_WINDOW, returns cached response
 * - Only applies to /api/v1/ai/ endpoints
 */

interface RequestCache {
  response: any;
  timestamp: number;
}

const requestCache = new Map<string, RequestCache>();
const DEDUP_WINDOW = 60000; // 1 minute deduplication window

/**
 * Generate unique key for request
 */
function getRequestKey(req: HttpRequest<any>): string {
  // Include method, URL, and body/params
  const body = req.body ? JSON.stringify(req.body) : '';
  const params = req.params.toString();
  return `${req.method}:${req.urlWithParams}:${body}:${params}`;
}

/**
 * Check if request is AI-related
 */
function isAIRequest(url: string): boolean {
  return url.includes('/api/v1/ai/');
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  requestCache.forEach((cache, key) => {
    if (now - cache.timestamp > DEDUP_WINDOW) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach((key) => requestCache.delete(key));

  if (expiredKeys.length > 0) {
    console.log(`[AI-DEDUP] Cleaned ${expiredKeys.length} expired cache entries`);
  }
}

export const aiDeduplicationInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept AI requests
  if (!isAIRequest(req.url)) {
    return next(req);
  }

  // Clean expired entries periodically
  cleanExpiredCache();

  const requestKey = getRequestKey(req);
  const cached = requestCache.get(requestKey);

  // Check if we have a recent duplicate request
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < DEDUP_WINDOW) {
      console.log(`[AI-DEDUP] 🚫 BLOCKED duplicate request (${(age / 1000).toFixed(1)}s ago)`);
      console.log(`[AI-DEDUP] URL: ${req.url}`);

      // Return cached response
      return of(new HttpResponse({
        body: cached.response,
        status: 200,
        statusText: 'OK (Cached by Deduplication)',
        url: req.url,
      }));
    }
  }

  // Allow request to proceed and cache the response
  console.log(`[AI-DEDUP] ✅ ALLOWING request: ${req.url}`);

  return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && event.status === 200) {
        // Cache successful response
          requestCache.set(requestKey, {
            response: event.body,
            timestamp: Date.now(),
          });
          console.log(`[AI-DEDUP] 💾 Cached response for deduplication`);
        }
      }),
      catchError((error) => {
      // Don't cache errors
        console.log(`[AI-DEDUP] ❌ Request failed, not caching`);
        return throwError(() => error);
      }),
  );
};
