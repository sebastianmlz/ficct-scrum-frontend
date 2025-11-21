import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ErrorLog, PaginatedErrorLogList, ErrorLogQueryParams}
  from '../../../core/models/interfaces';
import {SeverityEnum, ErrorLogStatusEnum} from '../../../core/models/enums';
import {LoggingService} from '../../../core/services/logging.service';

@Component({
  selector: 'app-error-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './error-logs.component.html',
  styles: [],
})
export class ErrorLogsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loggingService = inject(LoggingService);

  logsList = signal<PaginatedErrorLogList | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);

  Math = Math;

  searchForm: FormGroup = this.fb.group({
    search: [''],
    severity: [''],
    status: [''],
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    const formValues = this.searchForm.value;
    const params: ErrorLogQueryParams = {
      page: this.currentPage(),
      ...(formValues.search && {search: formValues.search}),
      ...(formValues.severity && {severity: formValues.severity}),
      ...(formValues.status && {status: formValues.status}),
    };

    this.loggingService.getErrorLogs(params).subscribe({
      next: (data) => {
        this.logsList.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading error logs:', error);
        this.error.set(error.error?.message || 'Failed to load error logs');
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

  viewDetails(log: ErrorLog): void {
    // Implement error details modal or navigation
    console.log('View error details:', log);
  }

  markResolved(logId: string): void {
    this.loggingService
        .updateErrorLogStatus(logId, ErrorLogStatusEnum.RESOLVED).subscribe({
          next: () => {
            this.loadLogs(); // Refresh data
          },
          error: (error) => {
            console.error('Error updating error status:', error);
            this.error.set(error.error?.message ||
              'Failed to update error status');
          },
        });
  }

  getSeverityBadgeClass(severity: SeverityEnum): string {
    switch (severity) {
      case SeverityEnum.LOW:
        return 'bg-gray-100 text-gray-800';
      case SeverityEnum.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case SeverityEnum.HIGH:
        return 'bg-orange-100 text-orange-800';
      case SeverityEnum.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(status: ErrorLogStatusEnum): string {
    switch (status) {
      case ErrorLogStatusEnum.NEW:
        return 'bg-blue-100 text-blue-800';
      case ErrorLogStatusEnum.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case ErrorLogStatusEnum.RESOLVED:
        return 'bg-green-100 text-green-800';
      case ErrorLogStatusEnum.CLOSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
