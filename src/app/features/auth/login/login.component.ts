import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { UserLoginRequest } from '../../../core/models/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div class="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div class="max-w-md w-full space-y-8 relative z-10">
        <!-- Logo & Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-fade-in">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 animate-slide-up">
            Welcome back
          </h2>
          <p class="mt-2 text-sm text-gray-600 animate-slide-up animation-delay-200">
            Sign in to your FICCT-SCRUM account
          </p>
        </div>

        <!-- Login Card -->
        <div class="bg-white backdrop-blur-lg bg-opacity-90 shadow-2xl rounded-2xl border border-gray-100 animate-slide-up animation-delay-400">
          <!-- Error Alert -->
          @if (authStore.error()) {
            <div class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
              <div class="flex items-center">
                <svg class="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-sm text-red-700">{{ authStore.error() }}</p>
              </div>
            </div>
          }
          
          <div class="p-8">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- Email Field -->
              <div class="relative">
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-transparent text-gray-900"
                  placeholder="Enter your email"
                  [class.border-red-300]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  [class.focus:border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  [class.focus:ring-red-100]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                />
                <label 
                  for="email" 
                  class="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white"
                  [class.text-red-600]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                >
                  Email Address *
                </label>
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <p class="mt-2 text-sm text-red-600 animate-slide-down">
                    <svg class="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Please enter a valid email address
                  </p>
                }
              </div>

              <!-- Password Field -->
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  class="peer w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-transparent text-gray-900"
                  placeholder="Enter your password"
                  [class.border-red-300]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  [class.focus:border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  [class.focus:ring-red-100]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                />
                <label 
                  for="password" 
                  class="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white"
                  [class.text-red-600]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                >
                  Password *
                </label>
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                  aria-label="Toggle password visibility"
                >
                  @if (showPassword()) {
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  } @else {
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  }
                </button>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <p class="mt-2 text-sm text-red-600 animate-slide-down">
                    <svg class="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Password is required
                  </p>
                }
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    formControlName="rememberMe"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  />
                  <label for="remember-me" class="ml-3 block text-sm text-gray-700 font-medium">
                    Remember me
                  </label>
                </div>

                <div class="text-sm">
                  <a routerLink="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                    Forgot password?
                  </a>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="loginForm.invalid || authStore.isLoading()"
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                @if (authStore.isLoading()) {
                  <div class="flex items-center">
                    <div class="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </div>
                    <span class="inline-block animate-pulse">Signing in...</span>
                  </div>
                } @else {
                  <span class="flex items-center">
                    Sign in
                    <svg class="ml-2 -mr-1 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </span>
                }
              </button>
            </form>

            <!-- Register Link -->
            <div class="mt-6 text-center">
              <span class="text-sm text-gray-600">Don't have an account? </span>
              <a routerLink="/auth/register" class="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Create one now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slide-down {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }
      
      .animate-fade-in { animation: fade-in 0.6s ease-out; }
      .animate-slide-up { animation: slide-up 0.6s ease-out; }
      .animate-slide-down { animation: slide-down 0.3s ease-out; }
      .animate-shake { animation: shake 0.5s ease-in-out; }
      
      .animation-delay-200 { animation-delay: 0.2s; }
      .animation-delay-400 { animation-delay: 0.4s; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }
    </style>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public authStore = inject(AuthStore);
  
  showPassword = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: UserLoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    try {
      await this.authStore.login(credentials);
      
      // Handle remember me functionality
      if (this.loginForm.value.rememberMe) {
        // Tokens are already stored in localStorage by default
        // Could extend token expiry here if needed
      }
      
      // Redirect to return URL or dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  }
}
