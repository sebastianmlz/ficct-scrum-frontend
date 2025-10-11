import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { User, UserProfile } from '../../../core/models/interfaces';
@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
})
export class ProfileViewComponent implements OnInit {
  private authStore = inject(AuthStore);

  user = signal<User | null>(null);
  userProfile = signal<UserProfile | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const currentUser = this.authStore.user();
    if (currentUser) {
      this.user.set(currentUser);
      // If user has profile nested data
      if (currentUser.profile) {
        this.userProfile.set({
          user: {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url
          },
          ...currentUser.profile
        });
      }
    }
    this.loading.set(false);
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
