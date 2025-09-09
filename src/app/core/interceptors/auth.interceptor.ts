import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for login, register, and password reset endpoints
    const skipAuth = this.shouldSkipAuth(req.url);
    
    if (skipAuth) {
      console.log('AuthInterceptor: Skipping auth for URL:', req.url);
      return next.handle(req);
    }

    // Get token from localStorage
    const token = this.authService.getToken();
    if (token) {
      console.log('AuthInterceptor: Adding token to request:', req.url);
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.log('AuthInterceptor: No token available for request:', req.url);
    }

    return next.handle(req);
  }

  private shouldSkipAuth(url: string): boolean {
    const skipUrls = [
      '/api/v1/auth/login/',
      '/api/v1/auth/register/',
      '/api/v1/auth/password-reset-request/',
      '/api/v1/auth/password-reset-confirm/',
      '/api/v1/auth/token/refresh/',
    ];
    
    return skipUrls.some(skipUrl => url.includes(skipUrl));
  }
}
