import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { UserRegistrationRequest } from '../../../core/models/interfaces';

@Component({
  selector: 'app-register',
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
            Create your FICCT-SCRUM account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <a routerLink="/auth/login" class="font-medium text-primary hover:text-primary/80">
              sign in to your existing account
            </a>
          </p>
        </div>

        <div hlmCard class="bg-white shadow-md">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="text-lg font-medium">Register for a new account</h3>
          </div>
          
          <div hlmCardContent>
            @if (authStore.error()) {
              <div hlmAlert class="mb-4 bg-red-50 border-red-200 text-red-800">
                {{ authStore.error() }}
              </div>
            }

            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label hlmLabel for="firstName" class="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    hlmInput
                    id="firstName"
                    type="text"
                    formControlName="first_name"
                    placeholder="First name"
                    class="mt-1 w-full"
                    [class.border-red-300]="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched"
                  />
                  @if (registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched) {
                    <p class="mt-1 text-sm text-red-600">First name is required</p>
                  }
                </div>

                <div>
                  <label hlmLabel for="lastName" class="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    hlmInput
                    id="lastName"
                    type="text"
                    formControlName="last_name"
                    placeholder="Last name"
                    class="mt-1 w-full"
                    [class.border-red-300]="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched"
                  />
                  @if (registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Last name is required</p>
                  }
                </div>
              </div>

              <div>
                <label hlmLabel for="username" class="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  hlmInput
                  id="username"
                  type="text"
                  formControlName="username"
                  placeholder="Choose a username"
                  class="mt-1 w-full"
                  [class.border-red-300]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
                />
                @if (registerForm.get('username')?.invalid && registerForm.get('username')?.touched) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (registerForm.get('username')?.errors?.['required']) {
                      Username is required
                    }
                    @if (registerForm.get('username')?.errors?.['minlength']) {
                      Username must be at least 3 characters long
                    }
                  </p>
                }
              </div>

              <div>
                <label hlmLabel for="email" class="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  hlmInput
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="Enter your email"
                  class="mt-1 w-full"
                  [class.border-red-300]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                />
                @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (registerForm.get('email')?.errors?.['required']) {
                      Email is required
                    }
                    @if (registerForm.get('email')?.errors?.['email']) {
                      Please enter a valid email address
                    }
                  </p>
                }
              </div>

              <div>
                <label hlmLabel for="password" class="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  hlmInput
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="Create a password"
                  class="mt-1 w-full"
                  [class.border-red-300]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                />
                @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (registerForm.get('password')?.errors?.['required']) {
                      Password is required
                    }
                    @if (registerForm.get('password')?.errors?.['minlength']) {
                      Password must be at least 8 characters long
                    }
                  </p>
                }
              </div>

              <div>
                <label hlmLabel for="passwordConfirm" class="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  hlmInput
                  id="passwordConfirm"
                  type="password"
                  formControlName="password_confirm"
                  placeholder="Confirm your password"
                  class="mt-1 w-full"
                  [class.border-red-300]="registerForm.get('password_confirm')?.invalid && registerForm.get('password_confirm')?.touched"
                />
                @if (registerForm.get('password_confirm')?.invalid && registerForm.get('password_confirm')?.touched) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (registerForm.get('password_confirm')?.errors?.['required']) {
                      Password confirmation is required
                    }
                    @if (registerForm.errors?.['passwordMismatch']) {
                      Passwords do not match
                    }
                  </p>
                }
              </div>

              <div>
                <button
                  hlmBtn
                  type="submit"
                  [disabled]="registerForm.invalid || authStore.isLoading()"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  @if (authStore.isLoading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  } @else {
                    Create account
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authStore = inject(AuthStore);

  registerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirm');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const userData: UserRegistrationRequest = {
      email: this.registerForm.value.email,
      username: this.registerForm.value.username,
      first_name: this.registerForm.value.first_name,
      last_name: this.registerForm.value.last_name,
      password: this.registerForm.value.password,
      password_confirm: this.registerForm.value.password_confirm
    };

    try {
      await this.authStore.register(userData);
      this.router.navigate(['/auth/login'], { 
        queryParams: { message: 'Registration successful! Please log in.' }
      });
    } catch (error) {
      // Error is handled by the store
      console.error('Registration failed:', error);
    }
  }
}
