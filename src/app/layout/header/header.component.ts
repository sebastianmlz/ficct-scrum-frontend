import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/store/auth.store';
import { NotificationsBackendService } from '../../core/services/notifications-backend.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ],
  templateUrl: 'header.component.html',
  styleUrl: 'header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  public authStore = inject(AuthStore);
  private notificationsService = inject(NotificationsBackendService);
  private router = inject(Router);

  user = computed(() => this.authService.getUser());
  mobileMenuOpen = false;
  showUserMenu = signal(false);
  unreadCount = signal(0);
  private pollInterval?: any;

  ngOnInit(): void {
    // Load unread count immediately
    this.loadUnreadCount();
    
    // Poll for unread count every 30 seconds
    this.pollInterval = setInterval(() => {
      this.loadUnreadCount();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadUnreadCount(): void {
    if (!this.authService.isLoggedIn()) return;
    
    this.notificationsService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.unread_count);
      },
      error: (err) => {
        console.error('Error loading unread count:', err);
      }
    });
  }

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