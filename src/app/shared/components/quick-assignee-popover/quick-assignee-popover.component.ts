import { Component, Input, Output, EventEmitter, OnInit, signal, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { IssueService } from '../../../core/services/issue.service';
import { ProjectMember, Issue } from '../../../core/models/interfaces';

@Component({
  selector: 'app-quick-assignee-popover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="absolute z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
      (click)="$event.stopPropagation()">
      
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200">
        <h4 class="text-sm font-medium text-gray-900">Assign to</h4>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Members List -->
      @if (!loading()) {
        <div class="max-h-64 overflow-y-auto">
          <!-- Search Input (if many members) -->
          @if (members().length > 8) {
            <div class="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                placeholder="Search members..."
                class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          }

          <!-- Unassigned Option -->
          <button
            (click)="selectAssignee(null)"
            class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            [class.bg-blue-50]="!currentAssignee()">
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700">Unassigned</span>
          </button>

          <!-- Member Options -->
          @for (member of filteredMembers(); track member.id) {
            <button
              (click)="selectAssignee(member.user.user_uuid || null)"
              [disabled]="!member.user.user_uuid"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              [class.bg-blue-50]="currentAssignee() === member.user.user_uuid">
              <div 
                [class]="'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ' + getAvatarColor(member.user.full_name)">
                {{ getInitials(member.user.full_name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ member.user.full_name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ member.user.email }}</p>
                @if (!member.user.user_uuid) {
                  <p class="text-xs text-red-600">⚠️ Missing UUID</p>
                }
              </div>
              @if (currentAssignee() === member.user.user_uuid) {
                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              }
            </button>
          }

          @if (filteredMembers().length === 0 && searchQuery) {
            <div class="px-4 py-6 text-center text-sm text-gray-500">
              No members found
            </div>
          }
        </div>
      }

      <!-- Error Message -->
      @if (error()) {
        <div class="px-4 py-3 bg-red-50 border-t border-red-100">
          <p class="text-xs text-red-800">{{ error() }}</p>
        </div>
      }

      <!-- Saving Indicator -->
      @if (saving()) {
        <div class="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
          <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span class="text-xs text-blue-800">Updating...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
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
  
  position = signal({ top: 0, left: 0 });
  currentAssignee = signal<string | null>(null);

  ngOnInit(): void {
    // Only use user_uuid, not ID fallback
    this.currentAssignee.set(this.issue.assignee?.user_uuid || null);
    console.log('[QUICK ASSIGNEE] Current assignee UUID:', this.currentAssignee());
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

    this.position.set({ top, left });
  }

  loadMembers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.projectService.getProjectMembers(this.projectId).subscribe({
      next: (response) => {
        console.log('[QUICK ASSIGNEE] ✅ Members loaded:', response.results?.length);
        console.log('[QUICK ASSIGNEE] Sample member data:', response.results?.[0]);
        console.log('[QUICK ASSIGNEE] Sample user object:', response.results?.[0]?.user);
        console.log('[QUICK ASSIGNEE] Has user_uuid?:', !!response.results?.[0]?.user?.user_uuid);
        
        // Check if backend is returning user_uuid
        const hasUserUuid = response.results?.some(m => m.user?.user_uuid);
        if (!hasUserUuid) {
          console.error('[QUICK ASSIGNEE] ⚠️ BACKEND ISSUE: user_uuid not provided in members response');
          console.error('[QUICK ASSIGNEE] Backend must include user_uuid in UserBasic serializer');
          this.error.set('Backend configuration error: user_uuid missing. Contact administrator.');
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
      }
    });
  }

  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredMembers.set(this.members());
      return;
    }

    const filtered = this.members().filter(m =>
      m.user.full_name.toLowerCase().includes(query) ||
      m.user.email.toLowerCase().includes(query)
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
    this.issueService.editIssue(this.issue.id, { assignee: userId || undefined }).subscribe({
      next: (updatedIssue) => {
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
      }
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
