import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { GitHubIntegrationStateService } from '../../../../core/services/github-integration-state.service';
import { RepositorySelectionModalComponent } from '../repository-selection-modal/repository-selection-modal.component';

@Component({
  selector: 'app-github-oauth-callback',
  standalone: true,
  imports: [CommonModule, RepositorySelectionModalComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100">
      <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <!-- Loading State -->
        @if (processing) {
          <div class="flex flex-col items-center gap-4">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <h2 class="text-xl font-semibold text-gray-900">Processing GitHub Authorization...</h2>
            <p class="text-sm text-gray-600">Please wait while we complete the connection.</p>
          </div>
        }

        <!-- Success State -->
        @if (success) {
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">GitHub Connected Successfully!</h2>
            <p class="text-sm text-gray-600">Redirecting to your project...</p>
          </div>
        }

        <!-- Error State -->
        @if (error) {
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Connection Failed</h2>
            <p class="text-sm text-gray-600">{{ errorMessage }}</p>
            <button 
              (click)="goToProject()"
              class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Return to Project
            </button>
          </div>
        }
      </div>
    </div>

    <!-- Repository Selection Modal -->
    @if (showRepositorySelection()) {
      <app-repository-selection-modal
        [projectId]="projectId()"
        [tempToken]="tempToken()"
        (completed)="onRepositorySelected()"
        (cancelled)="onRepositorySelectionCancelled()">
      </app-repository-selection-modal>
    }
  `,
  styles: []
})
export class GitHubOAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private integrationState = inject(GitHubIntegrationStateService);

  processing = true;
  success = false;
  error = false;
  errorMessage = '';
  showRepositorySelection = signal(false);
  tempToken = signal('');
  projectId = signal('');

  ngOnInit(): void {
    // Get query parameters from URL
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const message = params['message'];
      const integrationId = params['integration_id'];
      const errorMsg = params['error'];
      const tempToken = params['temp_token'];
      const selectRepo = params['github'];
      
      // Try multiple sources for projectId
      const projectIdFromStorage = localStorage.getItem('github_oauth_project_id');
      const projectIdFromRoute = this.route.snapshot.params['projectId'];
      const projectIdFromQuery = params['project_id'] || params['projectId'];
      const projectId = projectIdFromStorage || projectIdFromRoute || projectIdFromQuery;

      // NEW FLOW: Check for repository selection requirement
      if (selectRepo === 'select_repo') {
        if (!projectId) {
          this.handleError('Missing project ID. Please try connecting again from project settings.', null);
          return;
        }
        
        this.processing = false;
        this.projectId.set(projectId);
        this.tempToken.set(tempToken || '');
        this.showRepositorySelection.set(true);
        return; // Don't clean localStorage yet
      }

      // Legacy flow: Direct success/error handling
      if (status === 'success' && integrationId) {
        this.handleSuccess(message || 'GitHub repository connected successfully', projectId);
      } else if (status === 'error' || errorMsg) {
        this.handleError(errorMsg || message || 'Failed to connect GitHub repository', projectId);
      } else {
        this.handleError('Invalid callback parameters. Please try connecting again from project settings.', projectId);
      }

      // Clean up localStorage
      localStorage.removeItem('github_oauth_project_id');
    });
  }

  handleSuccess(message: string, projectId: string | null): void {
    this.processing = false;
    this.success = true;
    this.notificationService.success(message);

    // Redirect to project GitHub integration page after 2 seconds
    setTimeout(() => {
      if (projectId) {
        this.router.navigate(['/projects', projectId, 'github']);
      } else {
        this.router.navigate(['/projects']);
      }
    }, 2000);
  }

  handleError(message: string, projectId: string | null): void {
    this.processing = false;
    this.error = true;
    this.errorMessage = message;
    this.notificationService.error(message);
  }

  goToProject(): void {
    const projectId = localStorage.getItem('github_oauth_project_id');
    localStorage.removeItem('github_oauth_project_id');
    
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'github']);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  onRepositorySelected(): void {
    this.showRepositorySelection.set(false);
    const projectId = this.projectId();
    
    // Refresh state service cache with new integration
    if (projectId) {
      this.integrationState.refreshIntegrationStatus(projectId).subscribe();
    }
    
    // Clean up and redirect
    localStorage.removeItem('github_oauth_project_id');
    
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'config'], {
        fragment: 'integrations'
      });
    } else {
      this.router.navigate(['/projects']);
    }
  }

  onRepositorySelectionCancelled(): void {
    this.showRepositorySelection.set(false);
    const projectId = this.projectId();
    
    localStorage.removeItem('github_oauth_project_id');
    
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'config'], {
        fragment: 'integrations'
      });
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
