import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for login, register, and password reset endpoints
    const skipAuth = this.shouldSkipAuth(req.url);
    
    if (skipAuth) {
      return next.handle(req);
    }

    // Add auth header if we have a token
    const token = this.authStore.accessToken();
    if (token) {
      req = this.addTokenHeader(req, token);
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error as HttpErrorResponse);
      })
    );
  }

  private shouldSkipAuth(url: string): boolean {
    const skipUrls = [
      '/api/v1/auth/login/',
      '/api/v1/auth/register/',
      '/api/v1/auth/password-reset-request/',
      '/api/v1/auth/password-reset-confirm/'
    ];
    
    return skipUrls.some(skipUrl => url.includes(skipUrl));
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authStore.refreshToken();
      
      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap((response: { access: string; refresh?: string }) => {
            this.isRefreshing = false;
            
            // Update tokens in store and localStorage
            localStorage.setItem('access_token', response.access);
            if (response.refresh) {
              localStorage.setItem('refresh_token', response.refresh);
            }
            
            this.refreshTokenSubject.next(response.access);
            
            return next.handle(this.addTokenHeader(request, response.access));
          }),
          catchError((error: HttpErrorResponse) => {
            this.isRefreshing = false;
            
            // Refresh failed, logout user
            this.authStore.logout();
            
            return throwError(() => error);
          })
        );
      } else {
        // No refresh token, logout user
        this.authStore.logout();
        return throwError(() => new Error('No refresh token available'));
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}
