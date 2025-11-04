import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from './core/store/auth.store';
import { HeaderComponent } from './layout/header/header.component';
import { AiChatComponent } from './shared/components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, HeaderComponent, AiChatComponent]
})
export class AppComponent implements OnInit {
  title = 'ficct-scrum-frontend';
  private authStore = inject(AuthStore);
  private router = inject(Router);
  isLoginRoute = false;
  hasAccessToken = false;
  currentProjectId = signal<string | null>(null);

  async ngOnInit() {
    // Initialize authentication state from localStorage when app starts
    await this.authStore.initializeAuth();
    this.checkAccessToken();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
        this.checkAccessToken();
        
        // Extract project ID from URL if present
        const projectMatch = event.urlAfterRedirects.match(/\/projects\/([a-f0-9-]+)/);
        if (projectMatch) {
          this.currentProjectId.set(projectMatch[1]);
        } else {
          this.currentProjectId.set(null);
        }
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
