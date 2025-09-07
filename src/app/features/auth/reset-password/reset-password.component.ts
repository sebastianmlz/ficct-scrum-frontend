import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { PasswordResetConfirmRequest } from '../../../core/models/interfaces';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <div hlmCard class="bg-white shadow-md">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="text-lg font-medium">Reset Password</h3>
          </div>
          
          <div hlmCardContent>
            @if (authStore.error()) {
              <div hlmAlert class="mb-4 bg-red-50 border-red-200 text-red-800">
                {{ authStore.error() }}
              </div>
            }

            @if (resetSuccess) {
              <div hlmAlert class="mb-4 bg-green-50 border-green-200 text-green-800">
                <p class="font-medium">Password reset successful!</p>
                <p class="mt-1 text-sm">Your password has been updated successfully.</p>
              </div>
              
              <div class="text-center">
                <a routerLink="/auth/login" hlmBtn class="bg-primary text-primary-foreground hover:bg-primary/90">
                  Continue to Sign In
                </a>
              </div>
            } @else {
              @if (!token) {
                <div hlmAlert class="mb-4 bg-red-50 border-red-200 text-red-800">
                  <p class="font-medium">Invalid reset link</p>
                  <p class="mt-1 text-sm">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                </div>
                
                <div class="text-center">
                  <a routerLink="/auth/forgot-password" hlmBtn class="bg-primary text-primary-foreground hover:bg-primary/90">
                    Request New Reset
                  </a>
                </div>
              } @else {
                <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
                  <div>
                    <label hlmLabel for="newPassword" class="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      hlmInput
                      id="newPassword"
                      type="password"
                      formControlName="new_password"
                      placeholder="Enter your new password"
                      class="mt-1 w-full"
                      [class.border-red-300]="resetPasswordForm.get('new_password')?.invalid && resetPasswordForm.get('new_password')?.touched"
                    />
                    @if (resetPasswordForm.get('new_password')?.invalid && resetPasswordForm.get('new_password')?.touched) {
                      <p class="mt-1 text-sm text-red-600">
                        @if (resetPasswordForm.get('new_password')?.errors?.['required']) {
                          New password is required
                        }
                        @if (resetPasswordForm.get('new_password')?.errors?.['minlength']) {
                          Password must be at least 8 characters long
                        }
                      </p>
                    }
                  </div>

                  <div>
                    <label hlmLabel for="confirmPassword" class="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      hlmInput
                      id="confirmPassword"
                      type="password"
                      formControlName="new_password_confirm"
                      placeholder="Confirm your new password"
                      class="mt-1 w-full"
                      [class.border-red-300]="resetPasswordForm.get('new_password_confirm')?.invalid && resetPasswordForm.get('new_password_confirm')?.touched"
                    />
                    @if (resetPasswordForm.get('new_password_confirm')?.invalid && resetPasswordForm.get('new_password_confirm')?.touched) {
                      <p class="mt-1 text-sm text-red-600">
                        @if (resetPasswordForm.get('new_password_confirm')?.errors?.['required']) {
                          Password confirmation is required
                        }
                        @if (resetPasswordForm.errors?.['passwordMismatch']) {
                          Passwords do not match
                        }
                      </p>
                    }
                  </div>

                  <div>
                    <button
                      hlmBtn
                      type="submit"
                      [disabled]="resetPasswordForm.invalid || authStore.isLoading()"
                      class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      @if (authStore.isLoading()) {
                        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating password...
                      } @else {
                        Update Password
                      }
                    </button>
                  </div>
                </form>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public authStore = inject(AuthStore);

  token: string | null = null;
  resetSuccess = false;

  resetPasswordForm: FormGroup = this.fb.group({
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    new_password_confirm: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('new_password');
    const confirmPassword = form.get('new_password_confirm');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const request: PasswordResetConfirmRequest = {
      token: this.token,
      new_password: this.resetPasswordForm.value.new_password,
      new_password_confirm: this.resetPasswordForm.value.new_password_confirm
    };

    try {
      await this.authStore.confirmPasswordReset(request);
      this.resetSuccess = true;
    } catch (error) {
      // Error is handled by the store
      console.error('Password reset failed:', error);
    }
  }
}
