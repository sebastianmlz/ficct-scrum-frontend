import {Injectable, signal} from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);

  // Expose notifications as readonly signal
  readonly notifications$ = this.notifications.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  success(title: string, message?: string, duration = 5000): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }

  error(title: string, message?: string, persistent = false): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 8000,
    });
  }

  warning(title: string, message?: string, duration = 6000): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  info(title: string, message?: string, duration = 5000): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
    };

    this.notifications.update((notifications) =>
      [...notifications, newNotification]);

    // Auto-remove non-persistent notifications
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, notification.duration);
    }
  }

  remove(id: string): void {
    this.notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id),
    );
  }

  clear(): void {
    this.notifications.set([]);
  }

  // Helper methods for common scenarios
  apiSuccess(action: string): void {
    this.success('Success', `${action} completed successfully`);
  }

  apiError(action: string, error?: any): void {
    const message = error?.error?.message || error?.message ||
    'An unexpected error occurred';
    this.error('Error', `Failed to ${action.toLowerCase()}: ${message}`, true);
  }

  validationError(message = 'Please check the form and try again'): void {
    this.warning('Validation Error', message);
  }

  networkError(): void {
    this.error('Network Error',
        'Please check your internet connection and try again', true);
  }

  unauthorized(): void {
    this.error('Unauthorized', 'Please log in to continue', true);
  }

  forbidden(): void {
    this.error('Access Denied',
        'You do not have permission to perform this action', true);
  }
}
