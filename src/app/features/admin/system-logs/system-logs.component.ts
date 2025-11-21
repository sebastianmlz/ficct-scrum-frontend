import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {PaginatedSystemLogList, SystemLogQueryParams}
  from '../../../core/models/interfaces';
import {LoggingService} from '../../../core/services/logging.service';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './system-logs.component.html',
  styles: [],
})
export class SystemLogsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loggingService = inject(LoggingService);

  logsList = signal<PaginatedSystemLogList | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);

  Math = Math;

  searchForm: FormGroup = this.fb.group({
    search: [''],
    action_type: [''],
    level: [''],
    ip_address: [''],
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
      ...(formValues.search && {search: formValues.search}),
      ...(formValues.action_type && {action_type: formValues.action_type}),
      ...(formValues.level && {level: formValues.level}),
      ...(formValues.ip_address && {ip_address: formValues.ip_address}),
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
      },
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

  getActionBadgeClass(actionType: string): string {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'login':
      case 'user_login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
      case 'user_logout':
        return 'bg-gray-100 text-gray-800';
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

  getLevelBadgeClass(level: string): string {
    switch (level.toUpperCase()) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'CRITICAL':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
