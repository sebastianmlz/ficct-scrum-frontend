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
    accessToken: null,
    refreshToken: null
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
  isSuperUser = computed(() => this.state().user?.is_superuser === true);
  isStaff = computed(() => this.state().user?.is_staff === true);

  private updateState(updates: Partial<AuthState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // Public method to sync login state from external login
  public syncLoginState(user: User, accessToken: string, refreshToken: string): void {
    this.updateState({
      user,
      isAuthenticated: true,
      loading: false,
      error: null,
      accessToken,
      refreshToken
    });
  }
  async login(credentials: UserLoginRequest): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      const response: LoginResponse = await firstValueFrom(this.authService.login(credentials));
      
      // Store tokens immediately in localStorage and state
      localStorage.setItem('access', response.access);
      localStorage.setItem('refresh', response.refresh);
      
      this.updateState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        accessToken: response.access,
        refreshToken: response.refresh
      });
      
      console.log('Login successful, tokens stored:', {
        access: response.access.substring(0, 20) + '...',
        refresh: response.refresh.substring(0, 20) + '...'
      });
      
    } catch (error: any) {
      console.error('Login failed:', error);
      this.updateState({
        loading: false,
        error: error.error?.message || 'Login failed',
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null
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
        await firstValueFrom(this.authService.logoutt({ refresh: refreshToken }));
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      
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
    const token = await this.getValidToken();
    if (!token) {
      this.updateState({ isAuthenticated: false, user: null, loading: false });
      return;
    }

    this.updateState({ loading: true, error: null });
    
    try {
      const user: User = await firstValueFrom(this.authService.getCurrentUserFromAPI());
      
      this.updateState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('AuthStore getCurrentUser failed:', error);
      
      // Handle different error scenarios
      if (error.status === 401 || error.status === 403) {
        // Token is invalid, logout user
        await this.logout();
      } else {
        // Network or other errors - don't logout, just show error
        this.updateState({
          loading: false,
          error: 'Unable to verify user session. Please check your connection.'
        });
      }
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

  async updateProfile(userId: number, profileData: any): Promise<User | null> {
    if (!this.state().isAuthenticated) return null;
    this.updateState({ loading: true, error: null });
    try {
      const updatedUser: User = await firstValueFrom(this.authService.updateProfile(userId, profileData));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.updateState({
        user: updatedUser,
        loading: false,
        error: null
      });
      return updatedUser;
    } catch (error: any) {
      console.error('AuthStore updateProfile failed:', error);
      this.updateState({
        loading: false,
        error: error.error?.message || 'Failed to update profile'
      });
      throw error;
    }
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // Initialize auth state from localStorage on app start
  async initializeAuth(): Promise<void> {
    console.log("access token: ",localStorage.getItem('access'));
    const token = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    const userJson = localStorage.getItem('user');
    
    if (token && refreshToken) {
      let user = null;
      
      // Try to parse user from localStorage
      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
        }
      }
      
      // Update the state with tokens and user from localStorage
      this.updateState({
        accessToken: token,
        refreshToken: refreshToken,
        user: user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      console.log('Auth initialized from localStorage:', { 
        hasToken: !!token, 
        hasUser: !!user,
        userName: user?.first_name 
      });
      
      // Optionally verify token by getting fresh user data from server
      // (commented out to prevent immediate API call on every page load)
      /*
      try {
        await this.getCurrentUser();
      } catch (error) {
        console.error('Token verification failed during initialization:', error);
        // Don't logout immediately, let the user continue with cached data
      }
      */
    } else {
      // No tokens found, ensure user is logged out
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

  // Update tokens in both localStorage and store
  public updateTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('access', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh', refreshToken);
    }
    
    this.updateState({
      accessToken,
      refreshToken: refreshToken || this.state().refreshToken,
      isAuthenticated: true
    });
  }

  // Check if token is expired (basic JWT decode)
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  // Get token or refresh if needed
  async getValidToken(): Promise<string | null> {
    const token = this.state().accessToken;
    const refreshToken = this.state().refreshToken;
    
    if (!token || !refreshToken) {
      return null;
    }
    
    // If token is not expired, return it
    if (!this.isTokenExpired(token)) {
      return token;
    }
    
    // Token is expired, try to refresh
    try {
      const response = await firstValueFrom(this.authService.refreshToken(refreshToken));
      this.updateTokens(response.access, response.refresh);
      return response.access;
    } catch (error) {
      // Refresh failed, logout
      await this.logout();
      return null;
    }
  }
}
