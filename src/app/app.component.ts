import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { AuthStore } from './core/store/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <router-outlet />
    <app-notification />
  `,
  imports: [RouterOutlet, NotificationComponent]
})
export class AppComponent implements OnInit {
  title = 'ficct-scrum-frontend';
  private authStore = inject(AuthStore);

  async ngOnInit() {
    // Initialize authentication state from localStorage when app starts
    console.log('App initializing, checking auth state...');
    await this.authStore.initializeAuth();
  }
}
