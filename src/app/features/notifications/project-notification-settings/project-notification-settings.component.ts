import {Component, OnInit, inject, signal, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NotificationsBackendService, ProjectNotificationSettings} from '../../../core/services/notifications-backend.service';
import {NotificationService} from '../../../core/services/notification.service';
import {SlackWebhookTestComponent} from '../slack-webhook-test/slack-webhook-test.component';

@Component({
  selector: 'app-project-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SlackWebhookTestComponent],
  templateUrl: './project-notification-settings.component.html',
  styleUrl: './project-notification-settings.component.css',
})
export class ProjectNotificationSettingsComponent implements OnInit {
  private notificationsBackendService = inject(NotificationsBackendService);
  private notificationService = inject(NotificationService);

  projectId = input.required<string>();

  settings = signal<ProjectNotificationSettings>({
    project_id: '',
    slack_webhook_url: '',
    notify_on_issue_created: true,
    notify_on_sprint_started: true,
    notify_on_sprint_completed: true,
  });

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  showWebhookTest = signal(false);

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationsBackendService.getProjectSettings(this.projectId()).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading project notification settings:', err);
        this.error.set('Failed to load notification settings. Please try again.');
        this.loading.set(false);
        this.notificationService.error('Error', 'Failed to load notification settings');
      },
    });
  }

  updateSetting<K extends keyof ProjectNotificationSettings>(
      field: K,
      value: ProjectNotificationSettings[K],
  ): void {
    this.settings.update((settings) => ({...settings, [field]: value}));
  }

  saveSettings(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload: Partial<ProjectNotificationSettings> = {
      ...this.settings(),
      project_id: this.projectId(),
    };

    this.notificationsBackendService.updateProjectSettings(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.success('Success', 'Notification settings saved successfully');
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        this.error.set('Failed to save notification settings. Please try again.');
        this.saving.set(false);
        this.notificationService.error('Error', 'Failed to save notification settings');
      },
    });
  }

  openWebhookTest(): void {
    this.showWebhookTest.set(true);
  }

  closeWebhookTest(): void {
    this.showWebhookTest.set(false);
  }
}
