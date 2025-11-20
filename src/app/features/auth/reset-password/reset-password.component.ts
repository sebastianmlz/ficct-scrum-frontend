import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthStore} from '../../../core/store/auth.store';
import {PasswordResetConfirmRequest} from '../../../core/models/interfaces';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public authStore = inject(AuthStore);

  token: string | null = null;
  resetSuccess = false;
  invalidToken = false;

  resetPasswordForm: FormGroup = this.fb.group({
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    new_password_confirm: ['', [Validators.required]],
  }, {validators: this.passwordMatchValidator});

  constructor() {
    // Permitir token por query param o por param de ruta
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token = params['token'];
      }
    });
    this.route.params.subscribe((params) => {
      if (params['token']) {
        this.token = params['token'];
      }
    });
    // Log para depuración
    setTimeout(() => {
      console.log('[ResetPassword] Token recibido:', this.token);
    }, 0);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('new_password');
    const confirmPassword = form.get('new_password_confirm');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return {passwordMismatch: true};
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // Evitar duplicidad de token en el payload
    const {new_password, new_password_confirm} = this.resetPasswordForm.value;
    const request: PasswordResetConfirmRequest = {
      token: this.token!,
      new_password,
      new_password_confirm,
    };

    console.log('[ResetPassword] Payload enviado:', request);

    try {
      await this.authStore.confirmPasswordReset(request);
      this.resetSuccess = true;
    } catch (error: any) {
      // Log completo del error
      console.error('[ResetPassword] Password reset failed:', error);
      // Detectar error de token inválido
      if (error?.error?.token && Array.isArray(error.error.token) && error.error.token.includes('Invalid token')) {
        this.invalidToken = true;
      }
    }
  }
}
