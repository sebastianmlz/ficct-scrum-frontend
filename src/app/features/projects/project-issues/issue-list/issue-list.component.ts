import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService } from '../../../../core/services/issue.service';
import { PaginationParams, Issue } from '../../../../core/models/interfaces';
import { PaginatedIssueList } from '../../../../core/models/api-interfaces';

@Component({
  selector: 'app-issue-list',
  imports: [CommonModule],
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.css'
})
export class IssueListComponent {
  @Input() projectId!: string;

  private issueList = inject(IssueService)

  loading = signal(false);
  error = signal<string | null>(null);
  issues = signal<Issue[]>([]);
  paginationData = signal<PaginatedIssueList | null>(null);

  ngOnInit(): void {
    this.loadIssues();
  }

  convertirPriority(priority: string | null): string {
    switch (priority) {
      case 'P1':
        return priority = 'Critical';
      case 'P2':
        return priority = 'High';
      case 'P3':
        return priority = 'Medium';
      case 'P4':
        return priority = 'Low';
      default:
        return priority || 'Sin prioridad';
    }
  }

  getPriorityInfo(priority: string | null): { label: string, color: string } {
    switch (priority) {
      case 'P1': return { label: 'Critical', color: 'bg-red-100 text-red-800' };
      case 'P2': return { label: 'High', color: 'bg-orange-100 text-orange-800' };
      case 'P3': return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      case 'P4': return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
      default: return { label: 'Sin prioridad', color: 'bg-gray-100 text-gray-800' };
    }
  }

  async loadIssues(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.issueList.getIssues(params).toPromise();
      if (result) {
        this.issues.set(result.results);
        console.log('Issues loaded:', result.results);
        this.paginationData.set(result);
      }
    } catch (error) {
      this.error.set('Error loading issues');
    } finally {
      this.loading.set(false);
    }
  }
}
