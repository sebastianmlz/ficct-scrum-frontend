import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/store/auth.store';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ],
  templateUrl: 'header.component.html',
  styleUrl: 'header.component.css',
})
export class HeaderComponent {
  private authService = inject(AuthService);
    public authStore = inject(AuthStore);
    constructor( private router: Router) {}



  user = computed(() => this.authService.getUser());
  mobileMenuOpen = false;
    showUserMenu = signal(false);


  getInitials(fullName: string): string {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(current => !current);
  }

  async logout(): Promise<void> {
    try {
      // Try to logout through AuthStore first (which handles API call)
      await this.authStore.logout();
    } catch (error) {
      console.error('AuthStore logout failed, falling back to AuthService:', error);
      // Fallback to AuthService logout
      this.authService.logout();
    }
    
    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }
}