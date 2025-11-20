import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthStore} from '../../../core/store/auth.store';
import {PasswordResetRequestRequest} from '../../../core/models/interfaces';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  public authStore = inject(AuthStore);

  requestSent = false;

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const request: PasswordResetRequestRequest = {
      email: this.forgotPasswordForm.value.email,
    };

    try {
      await this.authStore.requestPasswordReset(request);
      this.requestSent = true;
    } catch (error) {
      // Error is handled by the store
      console.error('Password reset request failed:', error);
    }
  }
}
