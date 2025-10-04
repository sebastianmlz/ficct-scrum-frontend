import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from './core/store/auth.store';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, HeaderComponent]
})
export class AppComponent implements OnInit {
  title = 'ficct-scrum-frontend';
  private authStore = inject(AuthStore);
  private router = inject(Router);
  isLoginRoute = false;
  hasAccessToken = false;

  async ngOnInit() {
    // Initialize authentication state from localStorage when app starts
    await this.authStore.initializeAuth();
    this.checkAccessToken();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
        this.checkAccessToken();
      }
    });
    // Inicializar el valor al cargar
    this.isLoginRoute = this.router.url.startsWith('/login');
    this.checkAccessToken();
  }

  checkAccessToken() {
    this.hasAccessToken = !!localStorage.getItem('access');
  }
}
