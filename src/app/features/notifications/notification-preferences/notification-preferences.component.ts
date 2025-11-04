import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationsBackendService, NotificationPreferences } from '../../../core/services/notifications-backend.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.css'
})
export class NotificationPreferencesComponent implements OnInit {
  private notificationsBackendService = inject(NotificationsBackendService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  preferences = signal<NotificationPreferences>({
    email_enabled: true,
    in_app_enabled: true,
    slack_enabled: false,
    digest_enabled: false
  });

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationsBackendService.getPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading preferences:', err);
        this.error.set('Failed to load preferences. Please try again.');
        this.loading.set(false);
        this.notificationService.error('Error', 'Failed to load preferences');
      }
    });
  }

  updatePreference(field: keyof NotificationPreferences, value: boolean): void {
    this.preferences.update(prefs => ({ ...prefs, [field]: value }));
  }

  savePreferences(): void {
    this.saving.set(true);
    this.error.set(null);

    this.notificationsBackendService.updatePreferences(this.preferences()).subscribe({
      next: (updatedPrefs) => {
        this.preferences.set(updatedPrefs);
        this.saving.set(false);
        this.notificationService.success('Success', 'Preferences saved successfully');
      },
      error: (err) => {
        console.error('Error saving preferences:', err);
        this.error.set('Failed to save preferences. Please try again.');
        this.saving.set(false);
        this.notificationService.error('Error', 'Failed to save preferences');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/notifications']);
  }
}
