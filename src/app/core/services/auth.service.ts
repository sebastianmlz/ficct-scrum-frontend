import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UserLoginRequest,
  UserRegistrationRequest,
  LoginResponse,
  LogoutRequestRequest,
  LogoutResponse,
  PasswordResetRequestRequest,
  PasswordResetRequestResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  UserProfile
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/auth`;

  login(credentials: UserLoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login/`, credentials);
  }

  register(userData: UserRegistrationRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/register/`, userData);
  }

  logout(request: LogoutRequestRequest): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.baseUrl}/logout/`, request);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me/`);
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

  uploadAvatar(avatarFile: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    return this.http.post<UserProfile>(`${this.baseUrl}/profiles/upload-avatar/`, formData);
  }

  refreshToken(refreshToken: string): Observable<{ access: string; refresh?: string }> {
    return this.http.post<{ access: string; refresh?: string }>(`${this.baseUrl}/token/refresh/`, {
      refresh: refreshToken
    });
  }
}
