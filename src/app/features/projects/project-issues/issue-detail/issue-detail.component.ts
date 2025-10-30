import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService } from '../../../../core/services/issue.service';
import { Issue } from '../../../../core/models/interfaces';
import { IssueCommentsComponent } from '../issue-comments/issue-comments.component';
import { IssueLinksComponent } from '../issue-links/issue-links.component';

@Component({
  selector: 'app-issue-detail',
  imports: [CommonModule, IssueCommentsComponent, IssueLinksComponent],
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.css'
})
export class IssueDetailComponent {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();

  private issueService = inject(IssueService);

  loading = signal(false);
  error = signal<string | null>(null);
  issue = signal<Issue | null>(null);
  activeTab = signal<'details' | 'links' | 'comments'>('details');

  ngOnInit(): void {
    this.loadIssue();
  }

  async loadIssue(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const issueData = await this.issueService.getIssue(this.issueId).toPromise();
      if (issueData) {
        this.issue.set(issueData);
      }
    } catch (error) {
      console.error('Error loading issue:', error);
      this.error.set('Error al cargar la issue');
    } finally {
      this.loading.set(false);
    }
  }

  convertirPriority(priority: string | null): string {
    switch (priority) {
      case 'P1': return 'Critical';
      case 'P2': return 'High';
      case 'P3': return 'Medium';
      case 'P4': return 'Low';
      default: return priority || 'Sin prioridad';
    }
  }

  getPriorityBadgeClass(priority: string | null): string {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800';
      case 'P2': return 'bg-orange-100 text-orange-800';
      case 'P3': return 'bg-yellow-100 text-yellow-800';
      case 'P4': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(status: string ): string {
    switch (status?.toLowerCase()) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'to_do': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  setActiveTab(tab: 'details' | 'links' | 'comments'): void {
    this.activeTab.set(tab);
  }
}
