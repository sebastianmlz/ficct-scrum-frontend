import {Component, EventEmitter, inject, Input, OnInit, Output, signal}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IssueService} from '../../../../core/services/issue.service';
import {SprintsService} from '../../../../core/services/sprints.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {Issue, Sprint} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-add-issues-to-sprint-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-issues-to-sprint-dialog.component.html',
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
        const backlog = result.results
            .filter((issue) => !issue.sprint || issue.sprint === null);
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
      const filtered = this.backlogIssues().filter((issue) =>
        issue.title.toLowerCase().includes(term) ||
        issue.issue_type?.name.toLowerCase().includes(term),
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
      this.selectedIssueIds.set(current.filter((id) => id !== issueId));
    } else {
      this.selectedIssueIds.set([...current, issueId]);
    }
  }

  async onAddToSprint(): Promise<void> {
    if (this.selectedIssueIds().length === 0) return;

    this.adding.set(true);
    try {
      console.log('[ADD ISSUES] Adding', this.selectedIssueIds().length,
          'issues to sprint', this.sprint.id);

      // Use the bulk add method from SprintsService
      await this.sprintsService
          .addIssuesToSprint(this.sprint.id, this.selectedIssueIds())
          .toPromise();

      this.notificationService.success(
          `Successfully added ${this.selectedIssueIds().length} issue${this
              .selectedIssueIds()
              .length !== 1 ? 's' : ''} to ${this.sprint.name}`,
      );

      this.issuesAdded.emit();
    } catch (error: any) {
      console.error('[ADD ISSUES] Error:', error);
      this.notificationService
          .error(error.error?.message || 'Failed to add issues to sprint');
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
