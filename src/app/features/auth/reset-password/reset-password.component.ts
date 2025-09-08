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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
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
