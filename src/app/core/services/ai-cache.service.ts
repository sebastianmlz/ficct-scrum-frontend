import { Injectable } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds (0 = never expire)
}

/**
 * AI Cache Service
 * Previene llamadas redundantes usando localStorage
 * 
 * TTL Strategies:
 * - Embeddings/Index: Never expire (0) - solo invalidate manual
 * - Summaries: Invalidate when issue changes
 * - Search results: 1 hour TTL
 */
@Injectable({
  providedIn: 'root'
})
export class AiCacheService {
  private readonly CACHE_PREFIX = 'ai_cache_';
  
  // TTL constants (milliseconds)
  readonly TTL_NEVER = 0;
  readonly TTL_1_HOUR = 3600000;
  readonly TTL_1_DAY = 86400000;

  /**
   * Get cached data if valid
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cachedStr = localStorage.getItem(cacheKey);
      
      if (!cachedStr) {
        return null;
      }

      const cached: CacheEntry<T> = JSON.parse(cachedStr);
      
      // Check if expired (TTL = 0 means never expire)
      if (cached.ttl !== 0) {
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
          // Expired - remove from cache
          localStorage.removeItem(cacheKey);
          return null;
        }
      }

      console.log(`[AI-CACHE] ✅ HIT: ${key}`);
      return cached.data;
    } catch (error) {
      console.error('[AI-CACHE] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.TTL_1_HOUR): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`[AI-CACHE] 💾 STORED: ${key} (TTL: ${ttl === 0 ? 'never' : ttl / 1000 + 's'})`);
    } catch (error) {
      console.error('[AI-CACHE] Error storing cache:', error);
      // Si falla localStorage (quota exceeded), continuar sin cache
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    const cacheKey = this.getCacheKey(key);
    localStorage.removeItem(cacheKey);
    console.log(`[AI-CACHE] 🗑️ INVALIDATED: ${key}`);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = this.getAllCacheKeys();
    let count = 0;
    
    keys.forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key);
        count++;
      }
    });

    console.log(`[AI-CACHE] 🗑️ INVALIDATED ${count} entries matching: ${pattern}`);
  }

  /**
   * Clear all AI cache
   */
  clearAll(): void {
    const keys = this.getAllCacheKeys();
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`[AI-CACHE] 🗑️ CLEARED ${keys.length} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; size: string } {
    const keys = this.getAllCacheKeys();
    let totalSize = 0;

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      total: keys.length,
      size: this.formatBytes(totalSize)
    };
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getAllCacheKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
