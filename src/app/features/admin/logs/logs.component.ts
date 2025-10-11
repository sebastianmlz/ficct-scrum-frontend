import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemLog, PaginatedSystemLogList, SystemLogQueryParams } from '../../../core/models/interfaces';
import { LevelEnum } from '../../../core/models/enums';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loggingService = inject(LoggingService);

  logsList = signal<PaginatedSystemLogList | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  selectedLog = signal<SystemLog | null>(null);
  showModal = signal(false);

  Math = Math;

  searchForm: FormGroup = this.fb.group({
    search: [''],
    action_type: [''],
    level: [''],
    ip_address: ['']
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    const formValues = this.searchForm.value;
    const params: SystemLogQueryParams = {
      page: this.currentPage(),
      ...(formValues.search && { search: formValues.search }),
      ...(formValues.action_type && { action_type: formValues.action_type }),
      ...(formValues.level && { level: formValues.level }),
      ...(formValues.ip_address && { ip_address: formValues.ip_address })
    };

    this.loggingService.getSystemLogs(params).subscribe({
      next: (data) => {
        this.logsList.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading system logs:', error);
        this.error.set(error.error?.message || 'Failed to load system logs');
        this.loading.set(false);
      }
    });
  }

  searchLogs(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  nextPage(): void {
    if (this.logsList()?.next) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.logsList()?.previous && this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadLogs();
    }
  }

  viewDetails(log: SystemLog): void {
    this.selectedLog.set(log);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedLog.set(null);
  }

  getLevelBadgeClass(level: string): string {
    switch (level.toLowerCase()) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getActionTypeBadgeClass(actionType: string): string {
    switch (actionType.toLowerCase()) {
      case 'system_event':
        return 'bg-purple-100 text-purple-800';
      case 'user_action':
        return 'bg-blue-100 text-blue-800';
      case 'api_request':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  getUserAgent(log: SystemLog): string {
    if (log.user_agent) {
      return log.user_agent;
    }
    if (log.metadata && typeof log.metadata === 'object' && 'user_agent' in log.metadata) {
      return (log.metadata as any).user_agent;
    }
    return '';
  }

  hasUserAgent(log: SystemLog): boolean {
    return !!(log.user_agent || (log.metadata && typeof log.metadata === 'object' && 'user_agent' in log.metadata));
  }

  hasRequestData(log: SystemLog): boolean {
    return !!(log.request_data && typeof log.request_data === 'object' && Object.keys(log.request_data).length > 0);
  }

  hasMetadata(log: SystemLog): boolean {
    return !!(log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0);
  }
}
