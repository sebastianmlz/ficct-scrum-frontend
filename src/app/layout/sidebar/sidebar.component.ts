import {Component, inject, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterLinkActive, Router} from '@angular/router';
import {AuthStore} from '../../core/store/auth.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: 'sidebar.component.html',
})
export class SidebarComponent {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  user = computed(() => this.authStore.user());

  getInitials(fullName: string): string {
    return fullName.split(' ').map((n) => n[0])
        .join('').toUpperCase().slice(0, 2);
  }

  async logout(): Promise<void> {
    await this.authStore.logout();
  }
}
