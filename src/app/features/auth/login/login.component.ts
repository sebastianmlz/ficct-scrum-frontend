import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  loading: boolean = false;
  error: string = '';

  emailError: boolean = false;
  passwordError: boolean = false;


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateFields(): boolean {
    this.emailError = !this.email || !this.email.includes('@');
    this.passwordError = !this.password;
    return !(this.emailError || this.passwordError);
  }

  onSubmit(): void {
    if (!this.validateFields()) {
      this.error = 'Please enter valid email and password';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Store tokens and user info in localStorage
        localStorage.setItem('access', response.access);
        localStorage.setItem('refresh', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log(response.user)
        // Set user role if available
        if (response.user.is_staff) {
          localStorage.setItem('user_role', 'admin');
        } else {
          localStorage.setItem('user_role', 'customer');
        }
        
        // Sync AuthStore state with the login response
        this.authStore.syncLoginState(response.user, response.access, response.refresh);
        
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log("email:", this.email);
        console.log("password: ", this.password);
        console.error('Login error:', err);
        this.error = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
