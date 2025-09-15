import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: 'notification.component.html',
})
export class NotificationComponent {
  notificationService = inject(NotificationService);

  dismiss(id: string): void {
    this.notificationService.remove(id);
  }

  getNotificationClasses(type: Notification['type']): string {
    const baseClasses = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-400`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-400`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-400`;
      case 'info':
        return `${baseClasses} border-l-4 border-blue-400`;
      default:
        return baseClasses;
    }
  }

  getIconClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  }

  getTitleClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  getMessageClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  getDismissClasses(type: Notification['type']): string {
    const baseClasses = 'focus:ring-offset-2';
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-400 hover:text-green-500 focus:ring-green-500`;
      case 'error':
        return `${baseClasses} text-red-400 hover:text-red-500 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500`;
      case 'info':
        return `${baseClasses} text-blue-400 hover:text-blue-500 focus:ring-blue-500`;
      default:
        return `${baseClasses} text-gray-400 hover:text-gray-500 focus:ring-gray-500`;
    }
  }
}
