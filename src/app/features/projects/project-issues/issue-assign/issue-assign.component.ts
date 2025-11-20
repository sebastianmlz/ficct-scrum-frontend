import {Component, Input, Output, EventEmitter} from '@angular/core';
import {IssueService} from '../../../../core/services/issue.service';
import {CommonModule} from '@angular/common';
@Component({
  selector: 'app-issue-assign',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './issue-assign.component.html',
  styleUrls: ['./issue-assign.component.css'],
})
export class IssueAssignComponent {
  @Input() issueId!: string;
  @Output() assigned = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  success = false;

  constructor(private issueService: IssueService) {}

  assign() {
    if (!this.issueId) return;
    this.loading = true;
    this.error = null;
    this.issueService.assignIssue(this.issueId).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.assigned.emit();
        setTimeout(() => this.close.emit(), 1000);
      },
      error: (err) => {
        this.error = 'Error assigning issue';
        this.loading = false;
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}
