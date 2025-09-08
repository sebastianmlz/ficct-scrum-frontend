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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
