import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemLog, PaginatedSystemLogList, SystemLogQueryParams } from '../../../core/models/interfaces';
import { ActionTypeEnum, LevelEnum } from '../../../core/models/enums';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-4 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">System Logs</h1>
                <p class="mt-2 text-gray-600">Monitor system activity and user actions</p>
              </div>
              <a [routerLink]="['/admin']" class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Back to Dashboard
              </a>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Filters</h3>
            </div>
            <div class="px-6 py-4">
              <form [formGroup]="searchForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Search</label>
                    <input
                      type="text"
                      formControlName="search"
                      placeholder="Search logs..."
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Action Type</label>
                    <select formControlName="action_type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option value="">All Actions</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Level</label>
                    <select formControlName="level" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option value="">All Levels</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div class="flex items-end">
                    <button
                      type="button"
                      (click)="searchLogs()"
                      class="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          } @else if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error loading logs</h3>
                  <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
                </div>
              </div>
            </div>
          } @else {
            <!-- System Logs Table -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">System Logs ({{ logsList()?.count || 0 }} total)</h3>
              </div>
              
              @if (logsList()?.results && logsList()!.results.length > 0) {
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (log of logsList()!.results; track log.id) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ log.created_at | date:'medium' }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ log.user?.full_name || 'System' }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span [class]="getActionBadgeClass(log.action_type)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                              {{ log.action_type | titlecase }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span [class]="getLevelBadgeClass(log.level)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                              {{ log.level | titlecase }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ log.ip_address }}
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {{ log.message }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Pagination -->
                @if (logsList()!.count > 20) {
                  <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div class="flex-1 flex justify-between sm:hidden">
                      <button
                        [disabled]="!logsList()?.previous"
                        (click)="previousPage()"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        [disabled]="!logsList()?.next"
                        (click)="nextPage()"
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p class="text-sm text-gray-700">
                          Showing {{ ((currentPage() - 1) * 20) + 1 }} to {{ Math.min(currentPage() * 20, logsList()!.count) }} of {{ logsList()!.count }} results
                        </p>
                      </div>
                      <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            [disabled]="!logsList()?.previous"
                            (click)="previousPage()"
                            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            [disabled]="!logsList()?.next"
                            (click)="nextPage()"
                            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <div class="px-6 py-12 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                  <p class="mt-1 text-sm text-gray-500">No system logs match your current filters.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
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
