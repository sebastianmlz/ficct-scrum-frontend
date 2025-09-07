import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { 
  User, 
  UserLoginRequest, 
  UserRegistrationRequest, 
  LoginResponse,
  PasswordResetRequestRequest,
  PasswordResetConfirmRequest,
  UserProfile,
  UserProfileNested
} from '../models/interfaces';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private authService = inject(AuthService);
  
  private state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token')
  });

  // Computed signals
  isLoggedIn = computed(() => this.state().isAuthenticated && !!this.state().accessToken);
  currentUser = computed(() => this.state().user);
  isLoading = computed(() => this.state().loading);
  accessToken = computed(() => this.state().accessToken);
  refreshToken = computed(() => this.state().refreshToken);
  isAuthenticated = computed(() => this.state().isAuthenticated);
  user = computed(() => this.state().user);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  private updateState(updates: Partial<AuthState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }
  async login(credentials: UserLoginRequest): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      const response: LoginResponse = await firstValueFrom(this.authService.login(credentials));
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      this.updateState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        accessToken: response.access,
        refreshToken: response.refresh,
        error: null
      });
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Login failed',
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  }

  async register(userData: UserRegistrationRequest): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      const user: User = await firstValueFrom(this.authService.register(userData));
      
      this.updateState({
        user,
        loading: false,
        error: null
      });
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Registration failed'
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.updateState({ loading: true });
    
    try {
      const refreshToken = this.state().refreshToken;
      if (refreshToken) {
        await firstValueFrom(this.authService.logout({ refresh: refreshToken }));
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      this.updateState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        accessToken: null,
        refreshToken: null
      });
    }
  }

  async getCurrentUser(): Promise<void> {
    const token = this.state().accessToken;
    if (!token) {
      this.updateState({ isAuthenticated: false, user: null });
      return;
    }

    this.updateState({ loading: true });
    
    try {
      const user: User = await firstValueFrom(this.authService.getCurrentUser());
      
      this.updateState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error: any) {
      // Token might be expired or invalid
      this.logout();
      this.updateState({
        loading: false,
        error: error.error?.message || 'Failed to get current user'
      });
    }
  }

  async requestPasswordReset(request: PasswordResetRequestRequest): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      await firstValueFrom(this.authService.requestPasswordReset(request));
      this.updateState({ loading: false });
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Password reset request failed'
      });
      throw error;
    }
  }

  async confirmPasswordReset(request: PasswordResetConfirmRequest): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      await firstValueFrom(this.authService.confirmPasswordReset(request));
      this.updateState({ loading: false });
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Password reset confirmation failed'
      });
      throw error;
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    if (!this.state().isAuthenticated) return null;
    
    this.updateState({ loading: true });
    
    try {
      const profile: UserProfile = await firstValueFrom(this.authService.getProfile());
      this.updateState({ loading: false });
      return profile;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Failed to get profile'
      });
      return null;
    }
  }

  async uploadAvatar(avatarFile: File): Promise<UserProfile | null> {
    if (!this.state().isAuthenticated) return null;
    
    this.updateState({ loading: true });
    
    try {
      const profile: UserProfile = await firstValueFrom(this.authService.uploadAvatar(avatarFile));
      
      // Update user profile in store
      const currentUser = this.state().user;
      if (currentUser) {
        // Create the updated profile using all data from the API response
        const updatedProfile: UserProfileNested = {
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          phone_number: profile.phone_number,
          timezone: profile.timezone,
          language: profile.language,
          github_username: profile.github_username,
          linkedin_url: profile.linkedin_url,
          website_url: profile.website_url,
          notification_preferences: profile.notification_preferences,
          is_online: profile.is_online,
          last_activity: profile.last_activity,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };

        this.updateState({
          user: {
            ...currentUser,
            profile: updatedProfile
          },
          loading: false
        });
      }
      
      return profile;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.error?.message || 'Failed to upload avatar'
      });
      return null;
    }
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // Initialize auth state from localStorage on app start
  initializeAuth(): void {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      this.updateState({
        accessToken: token,
        refreshToken: refreshToken,
        isAuthenticated: true
      });
      
      // Verify token by getting current user
      this.getCurrentUser();
    }
  }
}
