import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface BackendNotification {
  id: string;
  recipient: string;
  recipient_email: string;
  recipient_name: string;
  notification_type: string;
  type_display: string;
  title: string;
  message: string;
  link: string;
  data: any;
  is_read: boolean;
  read_at: string | null;
  email_sent: boolean;
  slack_sent: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendNotification[];
}

export interface NotificationPreferences {
  id?: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  slack_enabled: boolean;
  digest_enabled: boolean;
  quiet_hours_enabled?: boolean;
  notification_types?: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferencesResponse {
  message: string;
  preferences: NotificationPreferences;
}

export interface ProjectNotificationSettings {
  project_id: string;
  slack_webhook_url: string;
  notify_on_issue_created: boolean;
  notify_on_sprint_started: boolean;
  notify_on_sprint_completed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsBackendService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/notifications`;

  /**
   * Get user's notifications (paginated)
   * GET /api/v1/notifications/
   */
  getNotifications(params?: {
    is_read?: boolean;
    notification_type?: string;
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    created_after?: string;
    created_before?: string;
  }): Observable<NotificationListResponse> {
    let httpParams = new HttpParams();

    if (params?.is_read !== undefined) {
      httpParams = httpParams.set('is_read', params.is_read.toString());
    }
    if (params?.notification_type) {
      httpParams = httpParams.set('notification_type',
          params.notification_type);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.created_after) {
      httpParams = httpParams.set('created_after', params.created_after);
    }
    if (params?.created_before) {
      httpParams = httpParams.set('created_before', params.created_before);
    }

    return this.http.get<NotificationListResponse>(`${
      this.apiUrl}/notifications/`, {params: httpParams});
  }

  /**
   * Mark single notification as read
   * PATCH /api/v1/notifications/{id}/
   */
  markAsRead(notificationId: string): Observable<BackendNotification> {
    return this.http.patch<BackendNotification>(
        `${this.apiUrl}/${notificationId}/`,
        {is_read: true},
    );
  }

  /**
   * Mark all user notifications as read
   * POST /api/v1/notifications/mark-all-read/
   */
  markAllAsRead(): Observable<{ message: string; updated_count: number }> {
    return this.http.post<{ message: string; updated_count: number }>(
        `${this.apiUrl}/notifications/mark-all-read/`,
        {},
    );
  }

  /**
   * Get unread notifications count
   * GET /api/v1/notifications/unread-count/
   */
  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(
        `${this.apiUrl}/notifications/unread-count/`,
    );
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/{id}/
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}/`);
  }

  /**
   * Delete all read notifications
   * DELETE /api/v1/notifications/delete-read/
   */
  deleteReadNotifications(): Observable<{ message: string;
    deleted_count: number }> {
    return this.http.delete<{ message: string; deleted_count: number }>(
        `${this.apiUrl}/delete-read/`,
    );
  }

  /**
   * Get user's notification preferences
   * GET /api/v1/notifications/preferences/
   */
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${
      this.apiUrl}/preferences/`);
  }

  /**
   * Update user's notification preferences
   * PATCH /api/v1/notifications/preferences/
   * Backend now returns:{message: string, preferences: NotificationPreferences}
   */
  updatePreferences(preferences: Partial<NotificationPreferences>)
  : Observable<NotificationPreferencesResponse> {
    console.log('[NOTIFICATION SERVICE] Updating preferences with PATCH');
    console.log('[NOTIFICATION SERVICE] Payload:', JSON.stringify(preferences));

    return this.http.patch<NotificationPreferencesResponse>(
        `${this.apiUrl}/preferences/`,
        preferences,
    );
  }

  /**
   * Test Slack webhook
   * POST /api/v1/notifications/test-slack/
   */
  testSlackWebhook(webhookUrl: string, message?: string)
  : Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
        `${this.apiUrl}/test-slack/`,
        {webhook_url: webhookUrl, message},
    );
  }

  /**
   * Get project notification settings
   * GET /api/v1/notifications/project-settings/?project={uuid}
   */
  getProjectSettings(projectId: string)
  : Observable<ProjectNotificationSettings> {
    const params = new HttpParams().set('project', projectId);
    return this.http.get<ProjectNotificationSettings>(
        `${this.apiUrl}/project-settings/`,
        {params},
    );
  }

  /**
   * Update project notification settings
   * PATCH /api/v1/notifications/project-settings/
   */
  updateProjectSettings(settings: Partial<ProjectNotificationSettings>)
  : Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
        `${this.apiUrl}/project-settings/`,
        settings,
    );
  }
}
