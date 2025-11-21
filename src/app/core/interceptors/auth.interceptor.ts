import {Injectable, inject} from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse}
  from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {NotificationService} from '../services/notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  intercept(req: HttpRequest<any>, next: HttpHandler):
  Observable<HttpEvent<any>> {
    // Skip auth header for login, register, and password reset endpoints
    const skipAuth = this.shouldSkipAuth(req.url);

    if (skipAuth) {
      console.log('AuthInterceptor: Skipping auth for URL:', req.url);
      return next.handle(req);
    }

    // Get token from localStorage
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.log('AuthInterceptor: No token available for request:', req.url);
    }

    // Handle the request and catch authentication errors
    return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized or 403 Forbidden
          if (error.status === 401 || error.status === 403) {
            console.error('[Auth Interceptor] Authentication error:',
                error.status);

            // Clear all auth data
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('user');
            localStorage.removeItem('user_role');

            // Show user-friendly message
            this.notificationService.error(
                'Session expired. Please log in again.');

            // Redirect to login page
            this.router.navigate(['/login']);

            // Return error to prevent further processing
            return throwError(() => new Error('Session expired'));
          }

          // For other errors, pass them through
          return throwError(() => error);
        }),
    );
  }

  private shouldSkipAuth(url: string): boolean {
    const skipUrls = [
      '/api/v1/auth/login/',
      '/api/v1/auth/register/',
      '/api/v1/auth/password-reset-request/',
      '/api/v1/auth/password-reset-confirm/',
      '/api/v1/auth/token/refresh/',
    ];

    return skipUrls.some((skipUrl) => url.includes(skipUrl));
  }
}
