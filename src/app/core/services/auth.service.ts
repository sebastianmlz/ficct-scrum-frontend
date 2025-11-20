import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry, tap} from 'rxjs/operators';
import {Router} from '@angular/router';

import {
  User,
  UserBasic,
  UserLoginRequest,
  UserRegistrationRequest,
  LoginResponse,
  LogoutRequestRequest,
  LogoutResponse,
  PasswordResetRequestRequest,
  PasswordResetRequestResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  UserProfile,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/auth`;
  constructor(private http: HttpClient, private router: Router) { }


  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login/`, {
      email: credentials.email,
      password: credentials.password,
    });
  }

  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access');
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'admin';
  }

  isSuperUser(): boolean {
    const user = this.getUser();
    return user?.is_superuser === true;
  }

  getToken(): string | null {
    return localStorage.getItem('access');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getCurrentUser(): UserBasic | null {
    const user = this.getUser();
    if (!user) return null;

    return {
      id: user.id,
      user_uuid: user.user_uuid,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
      avatar_url: user.avatar_url,
    };
  }


  register(userData: UserRegistrationRequest): Observable<User> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<User>(`${this.baseUrl}/register/`, userData, {headers});
  }

  logoutt(request: LogoutRequestRequest): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.baseUrl}/logout/`, request);
  }

  getCurrentUserFromAPI(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me/`).pipe(
        retry(2),
        catchError((error: HttpErrorResponse) => {
          console.error('getCurrentUser failed:', error);
          // Don't auto-logout here - let AuthStore handle it
          return throwError(() => error);
        }),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  requestPasswordReset(request: PasswordResetRequestRequest): Observable<PasswordResetRequestResponse> {
    return this.http.post<PasswordResetRequestResponse>(`${this.baseUrl}/password-reset-request/`, request);
  }

  confirmPasswordReset(request: PasswordResetConfirmRequest): Observable<PasswordResetConfirmResponse> {
    return this.http.post<PasswordResetConfirmResponse>(`${this.baseUrl}/password-reset-confirm/`, request);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profiles/me/`);
  }

  updateProfile(userId: number, profileData: any): Observable<User> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.patch<User>(`${this.baseUrl}/users/${userId}/`, profileData, {headers}).pipe(
        retry(1),
        catchError((error: HttpErrorResponse) => {
          console.error('updateProfile failed:', error);
          return throwError(() => error);
        }),
    );
  }

  uploadAvatar(avatarFile: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    return this.http.post<UserProfile>(`${this.baseUrl}/profiles/upload-avatar/`, formData);
  }

  refreshToken(refreshToken: string): Observable<{ access: string; refresh?: string }> {
    return this.http.post<{ access: string; refresh?: string }>(`${this.baseUrl}/token/refresh/`, {
      refresh: refreshToken,
    });
  }
}
