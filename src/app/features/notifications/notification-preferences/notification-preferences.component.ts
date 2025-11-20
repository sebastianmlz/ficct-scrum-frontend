import {Component, OnInit, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {NotificationsBackendService, NotificationPreferences} from '../../../core/services/notifications-backend.service';
import {NotificationService} from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.css',
})
export class NotificationPreferencesComponent implements OnInit {
  private notificationsBackendService = inject(NotificationsBackendService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  preferences = signal<NotificationPreferences>({
    email_enabled: true,
    in_app_enabled: true,
    slack_enabled: false,
    digest_enabled: false,
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
      },
    });
  }

  updatePreference(field: keyof NotificationPreferences, value: boolean): void {
    this.preferences.update((prefs) => ({...prefs, [field]: value}));
  }

  savePreferences(): void {
    console.log('[PREFERENCES] Starting save preferences...');
    console.log('[PREFERENCES] Current preferences:', this.preferences());

    this.saving.set(true);
    this.error.set(null);

    this.notificationsBackendService.updatePreferences(this.preferences()).subscribe({
      next: (response) => {
        console.log('[PREFERENCES] ✅ Save successful!');
        console.log('[PREFERENCES] Response message:', response.message);
        console.log('[PREFERENCES] Updated preferences:', response.preferences);

        // Extract preferences from wrapper
        this.preferences.set(response.preferences);
        this.saving.set(false);
        this.notificationService.success('Success', response.message || 'Preferences saved successfully');
      },
      error: (err) => {
        console.error('[PREFERENCES] ❌ Error saving preferences:', err);
        console.error('[PREFERENCES] Status:', err.status);
        console.error('[PREFERENCES] Error body:', err.error);

        let errorMessage = 'Failed to save preferences. Please try again.';

        if (err.status === 405) {
          errorMessage = 'Method not allowed. Please contact support.';
        } else if (err.status === 400) {
          errorMessage = err.error?.detail || 'Invalid preferences data.';
        } else if (err.status === 401 || err.status === 403) {
          errorMessage = 'Authentication required. Please login again.';
        }

        this.error.set(errorMessage);
        this.saving.set(false);
        this.notificationService.error('Error', errorMessage);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/notifications']);
  }
}
