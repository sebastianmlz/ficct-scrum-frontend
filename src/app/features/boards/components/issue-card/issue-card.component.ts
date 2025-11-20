import {Component, Input, Output, EventEmitter, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Issue} from '../../../../core/models/interfaces';
import {getPriorityLabel, getPriorityTailwindClasses} from '../../../../shared/utils/priority.utils';
import {QuickAssigneePopoverComponent} from '../../../../shared/components/quick-assignee-popover/quick-assignee-popover.component';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule, QuickAssigneePopoverComponent],
  templateUrl: './issue-card.component.html',
})
export class IssueCardComponent {
  @Input() issue!: Issue;
  @Input() projectId!: string;
  @Input() draggable = true;
  @Output() clicked = new EventEmitter<Issue>();
  @Output() assigneeChanged = new EventEmitter<{ issueId: string, assigneeId: string | null }>();

  showAssigneePopover = signal(false);
  avatarElement: HTMLElement | null = null;

  onClick(): void {
    this.clicked.emit(this.issue);
  }

  onAvatarClick(event: MouseEvent): void {
    event.stopPropagation(); // Prevent card click
    this.avatarElement = event.currentTarget as HTMLElement;
    this.showAssigneePopover.set(true);
  }

  closeAssigneePopover(): void {
    this.showAssigneePopover.set(false);
    this.avatarElement = null;
  }

  onAssigneeChanged(assigneeId: string | null): void {
    this.assigneeChanged.emit({issueId: this.issue.id, assigneeId});
    this.closeAssigneePopover();
  }

  /**
   * Get human-readable priority label
   * Converts P0/P1/P2/P3/P4 to Critical/High/Medium/Low/Lowest
   */
  getPriorityLabel(priority: string | null | undefined): string {
    return getPriorityLabel(priority);
  }

  /**
   * Get Tailwind CSS classes for priority badge
   */
  getPriorityColor(priority: string | null | undefined): string {
    return getPriorityTailwindClasses(priority);
  }

  getIssueTypeIcon(category: string): string {
    switch (category?.toLowerCase()) {
      case 'bug':
        return '🐛';
      case 'task':
        return '✓';
      case 'story':
        return '📖';
      case 'epic':
        return '⚡';
      case 'improvement':
        return '🚀';
      default:
        return '📝';
    }
  }

  /**
   * Get initials from full name for avatar display
   * Returns first letter of first and last name, or just first letter
   */
  getInitials(fullName: string): string {
    if (!fullName || fullName.trim().length === 0) return '?';

    const names = fullName.trim().split(' ').filter((n) => n.length > 0);

    if (names.length >= 2) {
      // First letter of first name + first letter of last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }

    // Just first letter of single name
    return names[0][0].toUpperCase();
  }

  /**
   * Generate consistent color for user avatar based on name hash
   * Returns Tailwind CSS classes for background and text color
   */
  getAvatarColor(fullName: string): string {
    if (!fullName) return 'bg-gray-400 text-white';

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Color palette (professional, high contrast with white text)
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

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
