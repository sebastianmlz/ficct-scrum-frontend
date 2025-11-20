import {Component, inject, OnInit, signal, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GitHubIntegrationService} from '../../../../core/services/github-integration.service';
import {NotificationService} from '../../../../core/services/notification.service';
import {GitHubOAuthRepository} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-repository-selection-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="text-xl font-semibold text-gray-900">Select GitHub Repository</h2>
          <button (click)="onCancel()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Loading State -->
          @if (loading()) {
            <div class="space-y-3">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-description"></div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Error State -->
          @else if (error()) {
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Failed to load repositories</h3>
              <p class="mt-1 text-sm text-gray-500">{{ errorMessage() }}</p>
              <button (click)="loadRepositories()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Retry
              </button>
            </div>
          }

          <!-- Empty State -->
          @else if (!loading() && repositories().length === 0) {
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No Accessible Repositories</h3>
              <p class="mt-1 text-sm text-gray-500">
                You don't have access to any GitHub repositories.<br>
                Create a repository on GitHub or request access.
              </p>
              <a href="https://github.com/new" target="_blank" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Create Repository on GitHub
              </a>
            </div>
          }

          <!-- Repository List -->
          @else {
            <div class="space-y-2">
              @for (repo of repositories(); track repo.id) {
                <button
                  (click)="selectRepository(repo)"
                  [class.selected]="selectedRepository()?.id === repo.id"
                  class="repository-card">
                  <!-- Repository Icon -->
                  <div class="flex-shrink-0">
                    <svg class="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>

                  <!-- Repository Info -->
                  <div class="flex-1 min-w-0 text-left">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-gray-900 truncate">{{ repo.full_name }}</p>
                      @if (repo.private) {
                        <span class="badge-private">Private</span>
                      } @else {
                        <span class="badge-public">Public</span>
                      }
                    </div>
                    @if (repo.description) {
                      <p class="text-sm text-gray-500 truncate mt-1">{{ repo.description }}</p>
                    }
                    <p class="text-xs text-gray-400 mt-1">Branch: {{ repo.default_branch }}</p>
                  </div>

                  <!-- Selection Indicator -->
                  @if (selectedRepository()?.id === repo.id) {
                    <svg class="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        @if (!loading() && !error() && repositories().length > 0) {
          <div class="modal-footer">
            <button (click)="onCancel()" class="btn-secondary">
              Cancel
            </button>
            <button
              (click)="onConfirm()"
              [disabled]="!selectedRepository() || completing()"
              class="btn-primary">
              @if (completing()) {
                <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              } @else {
                <span>Connect Repository</span>
              }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 0.5rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .repository-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      text-align: left;
      background: white;
    }

    .repository-card:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .repository-card.selected {
      border-color: #3b82f6;
      background: #dbeafe;
    }

    .badge-private {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #78350f;
      background: #fef3c7;
      border-radius: 9999px;
    }

    .badge-public {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #065f46;
      background: #d1fae5;
      border-radius: 9999px;
    }

    .skeleton-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .skeleton-icon {
      width: 2.5rem;
      height: 2.5rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-content {
      flex: 1;
    }

    .skeleton-title {
      height: 1rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      width: 60%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-description {
      height: 0.75rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      width: 80%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .btn-secondary {
      padding: 0.5rem 1rem;
      font-weight: 500;
      color: #374151;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-weight: 500;
      color: white;
      background: #3b82f6;
      border: none;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .modal-content {
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
  `],
})
export class RepositorySelectionModalComponent implements OnInit {
  @Input() projectId!: string;
  @Input() tempToken!: string;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private githubService = inject(GitHubIntegrationService);
  private notificationService = inject(NotificationService);

  repositories = signal<GitHubOAuthRepository[]>([]);
  selectedRepository = signal<GitHubOAuthRepository | null>(null);
  loading = signal(true);
  completing = signal(false);
  error = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadRepositories();
  }

  loadRepositories(): void {
    this.loading.set(true);
    this.error.set(false);

    this.githubService.getAvailableRepositories(this.projectId, this.tempToken).subscribe({
      next: (response) => {
        this.repositories.set(response.repositories);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading repositories:', err);
        this.error.set(true);
        this.errorMessage.set(err.error?.error || 'Failed to load repositories');
        this.loading.set(false);

        if (err.status === 400 && err.error?.error?.includes('expired')) {
          this.errorMessage.set('Authorization expired. Please reconnect GitHub.');
        }
      },
    });
  }

  selectRepository(repo: GitHubOAuthRepository): void {
    this.selectedRepository.set(repo);
  }

  onConfirm(): void {
    const selected = this.selectedRepository();
    if (!selected) return;

    this.completing.set(true);

    this.githubService.completeIntegration({
      temp_token: this.tempToken,
      repository_url: selected.html_url,
      repository_name: selected.full_name,
      project: this.projectId,
    }).subscribe({
      next: (response) => {
        this.notificationService.success('GitHub repository connected successfully!');
        this.completing.set(false);
        this.completed.emit();
      },
      error: (err) => {
        console.error('Error completing integration:', err);
        this.notificationService.error(err.error?.error || 'Failed to complete integration');
        this.completing.set(false);
      },
    });
  }

  onCancel(): void {
    if (!this.completing()) {
      this.cancelled.emit();
    }
  }
}
