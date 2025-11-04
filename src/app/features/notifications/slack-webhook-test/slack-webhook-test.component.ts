import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsBackendService } from '../../../core/services/notifications-backend.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-slack-webhook-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slack-webhook-test.component.html',
  styleUrl: './slack-webhook-test.component.css'
})
export class SlackWebhookTestComponent {
  private notificationsBackendService = inject(NotificationsBackendService);
  private notificationService = inject(NotificationService);

  webhookUrl = input.required<string>();
  close = output<void>();

  testMessage = signal('Hello from FICCT-SCRUM! 👋 This is a test notification.');
  testing = signal(false);
  testResult = signal<{ success: boolean; message: string } | null>(null);

  onClose(): void {
    this.close.emit();
  }

  testWebhook(): void {
    if (!this.webhookUrl() || !this.testMessage()) {
      this.notificationService.warning('Please provide both webhook URL and message');
      return;
    }

    this.testing.set(true);
    this.testResult.set(null);

    this.notificationsBackendService.testSlackWebhook(
      this.webhookUrl(),
      this.testMessage()
    ).subscribe({
      next: (result) => {
        this.testing.set(false);
        this.testResult.set(result);
        if (result.success) {
          this.notificationService.success('Success', 'Test message sent to Slack!');
        } else {
          this.notificationService.error('Test Failed', result.message);
        }
      },
      error: (err) => {
        console.error('Error testing webhook:', err);
        this.testing.set(false);
        const errorMessage = err?.error?.message || err?.message || 'Failed to send test message';
        this.testResult.set({ success: false, message: errorMessage });
        this.notificationService.error('Test Failed', errorMessage);
      }
    });
  }
}
