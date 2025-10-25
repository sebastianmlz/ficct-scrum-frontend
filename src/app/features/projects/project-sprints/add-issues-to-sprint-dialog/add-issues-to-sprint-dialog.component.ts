import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueService } from '../../../../core/services/issue.service';
import { SprintsService } from '../../../../core/services/sprints.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Issue, Sprint } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-add-issues-to-sprint-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" (click)="onCancel()"></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div class="sm:flex sm:items-start">
            <div class="w-full">
              <!-- Header -->
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Add Issues to {{ sprint?.name }}
                </h3>
                <button
                  type="button"
                  (click)="onCancel()"
                  class="text-gray-400 hover:text-gray-500">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Search box -->
              <div class="mb-4">
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  (ngModelChange)="filterIssues()"
                  placeholder="Search issues..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <!-- Loading state -->
              <div *ngIf="loading()" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-sm text-gray-600">Loading backlog issues...</p>
              </div>

              <!-- Issue list -->
              <div *ngIf="!loading()" class="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <div *ngIf="filteredIssues().length === 0" class="text-center py-8 text-gray-500">
                  <p>No backlog issues found</p>
                  <p class="text-sm mt-2">All issues are already assigned to sprints</p>
                </div>

                <div *ngFor="let issue of filteredIssues()" 
                     class="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    [id]="'issue-' + issue.id"
                    [checked]="isSelected(issue.id)"
                    (change)="toggleIssue(issue.id)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <label [for]="'issue-' + issue.id" class="ml-3 flex-1 cursor-pointer">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-900">{{ issue.title }}</span>
                      <span class="px-2 py-1 text-xs rounded-full" [ngClass]="{
                        'bg-red-100 text-red-800': issue.priority === 'P1',
                        'bg-orange-100 text-orange-800': issue.priority === 'P2',
                        'bg-yellow-100 text-yellow-800': issue.priority === 'P3',
                        'bg-green-100 text-green-800': issue.priority === 'P4',
                        'bg-gray-100 text-gray-800': !issue.priority
                      }">
                        {{ getPriorityLabel(issue.priority) }}
                      </span>
                      <span class="text-xs text-gray-500">{{ issue.issue_type?.name }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Selected count -->
              <p class="mt-3 text-sm text-gray-600">
                {{ selectedIssueIds().length }} issue{{ selectedIssueIds().length !== 1 ? 's' : '' }} selected
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              (click)="onAddToSprint()"
              [disabled]="selectedIssueIds().length === 0 || adding()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!adding()">Add to Sprint</span>
              <span *ngIf="adding()">Adding...</span>
            </button>
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="adding()"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AddIssuesToSprintDialogComponent implements OnInit {
  @Input() sprint!: Sprint;
  @Input() projectId!: string;
  @Output() issuesAdded = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  private issueService = inject(IssueService);
  private sprintsService = inject(SprintsService);
  private notificationService = inject(NotificationService);

  loading = signal(false);
  adding = signal(false);
  backlogIssues = signal<Issue[]>([]);
  filteredIssues = signal<Issue[]>([]);
  selectedIssueIds = signal<string[]>([]);
  searchTerm = '';

  ngOnInit(): void {
    this.loadBacklogIssues();
  }

  async loadBacklogIssues(): Promise<void> {
    this.loading.set(true);
    try {
      console.log('[ADD ISSUES] Loading backlog for project:', this.projectId);
      
      // Load issues with sprint=null (backlog)
      const result = await this.issueService.getIssues({ 
        project: this.projectId,
        // Note: Depending on backend, might need special param for backlog
        // For now, loading all and filtering client-side
      }).toPromise();

      if (result?.results) {
        // Filter only issues without sprint (backlog)
        const backlog = result.results.filter(issue => !issue.sprint || issue.sprint === null);
        console.log('[ADD ISSUES] Found', backlog.length, 'backlog issues');
        this.backlogIssues.set(backlog);
        this.filteredIssues.set(backlog);
      }
    } catch (error) {
      console.error('[ADD ISSUES] Error loading backlog:', error);
      this.notificationService.error('Failed to load backlog issues');
    } finally {
      this.loading.set(false);
    }
  }

  filterIssues(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredIssues.set(this.backlogIssues());
    } else {
      const filtered = this.backlogIssues().filter(issue => 
        issue.title.toLowerCase().includes(term) ||
        issue.issue_type?.name.toLowerCase().includes(term)
      );
      this.filteredIssues.set(filtered);
    }
  }

  isSelected(issueId: string): boolean {
    return this.selectedIssueIds().includes(issueId);
  }

  toggleIssue(issueId: string): void {
    const current = this.selectedIssueIds();
    if (current.includes(issueId)) {
      this.selectedIssueIds.set(current.filter(id => id !== issueId));
    } else {
      this.selectedIssueIds.set([...current, issueId]);
    }
  }

  async onAddToSprint(): Promise<void> {
    if (this.selectedIssueIds().length === 0) return;

    this.adding.set(true);
    try {
      console.log('[ADD ISSUES] Adding', this.selectedIssueIds().length, 'issues to sprint', this.sprint.id);
      
      // Use the bulk add method from SprintsService
      await this.sprintsService.addIssuesToSprint(this.sprint.id, this.selectedIssueIds()).toPromise();
      
      this.notificationService.success(
        `Successfully added ${this.selectedIssueIds().length} issue${this.selectedIssueIds().length !== 1 ? 's' : ''} to ${this.sprint.name}`
      );
      
      this.issuesAdded.emit();
    } catch (error: any) {
      console.error('[ADD ISSUES] Error:', error);
      this.notificationService.error(error.error?.message || 'Failed to add issues to sprint');
    } finally {
      this.adding.set(false);
    }
  }

  onCancel(): void {
    if (!this.adding()) {
      this.canceled.emit();
    }
  }

  getPriorityLabel(priority: string | null): string {
    switch (priority) {
      case 'P1': return 'Critical';
      case 'P2': return 'High';
      case 'P3': return 'Medium';
      case 'P4': return 'Low';
      default: return 'None';
    }
  }
}
