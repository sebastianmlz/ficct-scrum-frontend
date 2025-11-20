import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ProjectService} from '../../../core/services/project.service';
import {IssueService} from '../../../core/services/issue.service';
import {ProjectMember, Issue} from '../../../core/models/interfaces';

@Component({
  selector: 'app-quick-assignee-popover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-assignee-popover.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class QuickAssigneePopoverComponent implements OnInit {
  private projectService = inject(ProjectService);
  private issueService = inject(IssueService);

  @Input() issue!: Issue;
  @Input() projectId!: string;
  @Input() triggerElement!: HTMLElement;
  @Output() assigneeChanged = new EventEmitter<string | null>();
  @Output() closed = new EventEmitter<void>();

  members = signal<ProjectMember[]>([]);
  filteredMembers = signal<ProjectMember[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  searchQuery = '';

  position = signal({top: 0, left: 0});
  currentAssignee = signal<string | null>(null);

  ngOnInit(): void {
    // Only use user_uuid, not ID fallback
    this.currentAssignee.set(this.issue.assignee?.user_uuid || null);
    console.log(
        '[QUICK ASSIGNEE] Current assignee UUID:',
        this.currentAssignee(),
    );
    this.calculatePosition();
    this.loadMembers();
  }

  calculatePosition(): void {
    if (!this.triggerElement) return;

    const rect = this.triggerElement.getBoundingClientRect();
    const popoverWidth = 256; // w-64 = 16rem = 256px
    const popoverHeight = 300; // estimated max height

    let top = rect.bottom + 8; // 8px gap below trigger
    let left = rect.left;

    // Adjust if popover goes off right edge
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 16;
    }

    // Adjust if popover goes off bottom edge
    if (top + popoverHeight > window.innerHeight) {
      top = rect.top - popoverHeight - 8; // Show above trigger
    }

    // Ensure minimum margins
    top = Math.max(16, top);
    left = Math.max(16, left);

    this.position.set({top, left});
  }

  loadMembers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.projectService.getProjectMembers(this.projectId).subscribe({
      next: (response) => {
        console.log(
            '[QUICK ASSIGNEE] ✅ Members loaded:',
            response.results?.length,
        );
        console.log(
            '[QUICK ASSIGNEE] Sample member data:',
            response.results?.[0],
        );
        console.log(
            '[QUICK ASSIGNEE] Sample user object:',
            response.results?.[0]?.user,
        );
        console.log(
            '[QUICK ASSIGNEE] Has user_uuid?:',
            !!response.results?.[0]?.user?.user_uuid,
        );

        // Check if backend is returning user_uuid
        const hasUserUuid = response.results?.some((m) => m.user?.user_uuid);
        if (!hasUserUuid) {
          console.error(
              '[QUICK ASSIGNEE] ⚠️ BACKEND ISSUE: user_uuid not provided ' +
              'in members response',
          );
          console.error(
              '[QUICK ASSIGNEE] Backend must include user_uuid in UserBasic ' +
              'serializer',
          );
          this.error.set(
              'Backend configuration error: user_uuid missing. Contact ' +
              'administrator.',
          );
          this.loading.set(false);
          return;
        }

        this.members.set(response.results || []);
        this.filteredMembers.set(response.results || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load members');
        this.loading.set(false);
        console.error('[QUICK ASSIGNEE] Error loading members:', err);
      },
    });
  }

  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredMembers.set(this.members());
      return;
    }

    const filtered = this.members().filter(
        (m) =>
          m.user.full_name.toLowerCase().includes(query) ||
        m.user.email.toLowerCase().includes(query),
    );
    this.filteredMembers.set(filtered);
  }

  selectAssignee(userId: string | null): void {
    if (this.saving()) return;

    // Optimistic update
    const previousAssignee = this.currentAssignee();
    this.currentAssignee.set(userId);
    this.saving.set(true);
    this.error.set(null);

    // Update via API
    this.issueService
        .editIssue(this.issue.id, {assignee: userId || undefined})
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.assigneeChanged.emit(userId);

            // Close popover after short delay
            setTimeout(() => this.closed.emit(), 200);
          },
          error: (err) => {
          // Revert optimistic update
            this.currentAssignee.set(previousAssignee);
            this.error.set('Failed to update assignee');
            this.saving.set(false);
            console.error('[QUICK ASSIGNEE] Error updating assignee:', err);
          },
        });
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  getAvatarColor(fullName: string): string {
    if (!fullName) return 'bg-gray-400 text-white';

    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-teal-500 text-white',
      'bg-cyan-500 text-white',
      'bg-emerald-500 text-white',
      'bg-amber-500 text-white',
    ];

    return colors[Math.abs(hash) % colors.length];
  }
}
