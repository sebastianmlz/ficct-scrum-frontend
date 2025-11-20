import {Component, OnInit, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {NotificationsBackendService, BackendNotification} from '../../../core/services/notifications-backend.service';
import {NotificationService} from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css',
})
export class NotificationListComponent implements OnInit {
  private notificationsBackendService = inject(NotificationsBackendService);
  private notificationService = inject(NotificationService);

  notifications = signal<BackendNotification[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  filterUnreadOnly = signal(false);
  selectedType = signal<string>('all');

  notificationTypes = [
    {value: 'all', label: 'All Notifications'},
    {value: 'issue_created', label: 'Issue Created'},
    {value: 'issue_updated', label: 'Issue Updated'},
    {value: 'sprint_started', label: 'Sprint Started'},
    {value: 'sprint_completed', label: 'Sprint Completed'},
    {value: 'deadline_approaching', label: 'Deadline Approaching'},
    {value: 'assignment', label: 'Assignment'},
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page_size: 20,
      ordering: '-created_at',
    };

    if (this.filterUnreadOnly()) {
      params.is_read = false;
    }
    if (this.selectedType() !== 'all') {
      params.notification_type = this.selectedType();
    }

    this.notificationsBackendService.getNotifications(params).subscribe({
      next: (response) => {
        // Validación defensiva: si la respuesta no tiene results como array, mostrar error
        if (!response || !Array.isArray(response.results)) {
          this.notifications.set([]);
          this.error.set('Unexpected API response. Please contact backend or try again later.');
          this.loading.set(false);
          return;
        }
        this.notifications.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.error.set('Failed to load notifications. Please try again.');
        this.loading.set(false);
        this.notificationService.error('Error', 'Failed to load notifications');
      },
    });
  }

  toggleUnreadFilter(): void {
    this.filterUnreadOnly.update((value) => !value);
    this.loadNotifications();
  }

  changeType(type: string): void {
    this.selectedType.set(type);
    this.loadNotifications();
  }

  markAsRead(notification: BackendNotification): void {
    if (notification.is_read) return;

    this.notificationsBackendService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        // Update local state with the updated notification from backend
        this.notifications.update((notifications) =>
          notifications.map((n) => n.id === notification.id ? updatedNotification : n),
        );
        this.notificationService.success('Marked as read');
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
        this.notificationService.error('Error', 'Failed to mark as read');
      },
    });
  }

  markAllAsRead(): void {
    this.notificationsBackendService.markAllAsRead().subscribe({
      next: (response) => {
        // Reload notifications to get updated state
        this.loadNotifications();
        this.notificationService.success('Success', response.message);
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
        this.notificationService.error('Error', 'Failed to mark all as read');
      },
    });
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'issue_created': '📝',
      'issue_updated': '✏️',
      'sprint_started': '🚀',
      'sprint_completed': '✅',
      'deadline_approaching': '⏰',
      'assignment': '👤',
      'default': '🔔',
    };
    return icons[type] || icons['default'];
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
