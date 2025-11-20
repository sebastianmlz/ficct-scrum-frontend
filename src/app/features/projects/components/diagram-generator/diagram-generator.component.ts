import {Component, OnInit, signal, inject, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {
  GitHubDiagramService,
  DiagramErrorResponse,
  ParsedDiagramResponse,
} from '../../../../core/services/github-diagram.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {GitHubIntegration} from '../../../../core/models/interfaces';

type DiagramType = 'uml' | 'architecture' | null;

interface ErrorMessageConfig {
  title: string;
  message: string;
  action: 'dismiss' | 'navigate_to_settings' | 'retry' | 'retry_and_report';
  buttonText?: string;
  severity: 'warning' | 'error' | 'critical';
}

@Component({
  selector: 'app-diagram-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-generator.component.html',
  styleUrls: ['./diagram-generator.component.scss'],
})
export class DiagramGeneratorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(GitHubDiagramService);
  private notificationService = inject(NotificationService);

  // State signals
  projectId = signal<string>('');
  hasGitHubIntegration = signal<boolean | null>(null);
  integration = signal<GitHubIntegration | null>(null);
  isLoading = signal<boolean>(false);
  selectedDiagramType = signal<DiagramType>(null);
  diagramData = signal<ParsedDiagramResponse | null>(null);
  error = signal<DiagramErrorResponse | null>(null);
  loadingStartTime = signal<number>(0);

  // Computed signals
  isCheckingIntegration = computed(() => this.hasGitHubIntegration() === null);
  canGenerate = computed(() => this.hasGitHubIntegration() === true &&
    !this.isLoading());
  elapsedTime = signal<number>(0);
  errorConfig = signal<ErrorMessageConfig | null>(null);

  // Error message mapping
  private readonly ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
    'INVALID_OPTIONS': {
      title: 'Invalid Diagram Options',
      message: 'Only class diagrams are supported in v1. Sequence ' +
      'diagrams coming soon.',
      action: 'dismiss',
      buttonText: 'Dismiss',
      severity: 'warning',
    },
    'CONFIGURATION_ERROR': {
      title: 'GitHub Not Connected',
      message: 'Your GitHub integration needs to be set up or reconnected.',
      action: 'navigate_to_settings',
      buttonText: 'Go to Settings',
      severity: 'error',
    },
    'QUERY_ERROR': {
      title: 'Database Error',
      message: 'Could not retrieve diagram data. Please try again.',
      action: 'retry',
      buttonText: 'Retry',
      severity: 'error',
    },
    'INTERNAL_ERROR': {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again ' +
      'or contact support.',
      action: 'retry_and_report',
      buttonText: 'Retry',
      severity: 'critical',
    },
    'TIMEOUT_ERROR': {
      title: 'Request Timeout',
      message: 'The diagram generation is taking too long. Please try again.',
      action: 'retry',
      buttonText: 'Retry',
      severity: 'error',
    },
  };

  ngOnInit(): void {
    // Get project ID from route
    this.route.parent?.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.detectGitHubIntegration();
      }
    });
  }

  /**
   * Detect if project has GitHub integration
   * This is the GATE CHECK before allowing diagram generation
   */
  detectGitHubIntegration(): void {
    console.log('[DIAGRAM GENERATOR] Detecting GitHub integration...');
    this.hasGitHubIntegration.set(null); // Set to checking state

    this.diagramService.checkGitHubIntegration(this.projectId()).subscribe({
      next: (integration) => {
        if (integration) {
          console.log('[DIAGRAM GENERATOR] ✅ GitHub integration found');
          this.hasGitHubIntegration.set(true);
          this.integration.set(integration);
        } else {
          console.log('[DIAGRAM GENERATOR] ⚠️ No GitHub integration');
          this.hasGitHubIntegration.set(false);
        }
      },
      error: (error) => {
        console.error('[DIAGRAM GENERATOR] Error checking integration:', error);
        this.hasGitHubIntegration.set(false);
        this.notificationService.error('Failed to check GitHub integration');
      },
    });
  }

  /**
   * User selects diagram type
   */
  selectDiagramType(type: 'uml' | 'architecture'): void {
    if (!this.canGenerate()) {
      console.warn('[DIAGRAM GENERATOR] Cannot generate - ' +
          'no GitHub integration');
      return;
    }

    console.log('[DIAGRAM GENERATOR] Selected diagram type:', type);
    this.selectedDiagramType.set(type);
    this.generateDiagram(type);
  }

  /**
   * Generate diagram based on type
   */
  generateDiagram(type: 'uml' | 'architecture'): void {
    console.log('[DIAGRAM GENERATOR] Generating', type, 'diagram...');

    // Reset state
    this.isLoading.set(true);
    this.error.set(null);
    this.diagramData.set(null);
    this.loadingStartTime.set(Date.now());
    this.startElapsedTimeTracking();

    const generateObservable = type === 'uml' ?
      this.diagramService.generateUMLDiagram(this.projectId()) :
      this.diagramService.generateArchitectureDiagram(this.projectId());

    generateObservable.subscribe({
      next: (response) => {
        console.log('[DIAGRAM GENERATOR] ✅ Diagram generated successfully');
        this.handleSuccess(response);
      },
      error: (error: DiagramErrorResponse) => {
        console.error('[DIAGRAM GENERATOR] ❌ Error generating diagram:', error);
        this.handleError(error);
      },
    });
  }

  /**
   * Handle successful diagram generation
   */
  handleSuccess(response: ParsedDiagramResponse): void {
    const elapsed = ((Date.now() - this.loadingStartTime()) / 1000).toFixed(1);
    console.log('[DIAGRAM GENERATOR] Generation completed in',
        elapsed, 'seconds');

    this.isLoading.set(false);
    this.diagramData.set(response);
    this.error.set(null);

    this.notificationService.success(`Diagram generated successfully`);
  }

  /**
   * Handle diagram generation error with specific error codes
   */
  handleError(error: DiagramErrorResponse): void {
    console.log('[DIAGRAM GENERATOR] Handling error with code:', error.code);

    this.isLoading.set(false);
    this.error.set(error);
    this.diagramData.set(null);

    // Map error code to user-friendly configuration
    const config = this.ERROR_MESSAGES[error.code];
    if (config) {
      console.log('[DIAGRAM GENERATOR] Mapped error to config:', config.title);
      this.errorConfig.set(config);

      // Show appropriate notification
      if (config.severity === 'warning') {
        this.notificationService.error(config.title); // No warn method
      } else {
        this.notificationService.error(config.title);
      }
    } else {
      // Fallback for unmapped error codes
      console.warn('[DIAGRAM GENERATOR] Unmapped error code:', error.code);
      this.errorConfig.set({
        title: 'Error',
        message: error.error || 'An error occurred',
        action: 'retry',
        buttonText: 'Retry',
        severity: 'error',
      });
      this.notificationService.error('Failed to generate diagram');
    }
  }

  /**
   * Retry diagram generation
   */
  retry(): void {
    if (this.selectedDiagramType()) {
      this.generateDiagram(this.selectedDiagramType()!);
    }
  }

  /**
   * Navigate to GitHub integration settings
   */
  goToGitHubSettings(): void {
    this.router.navigate(['/projects', this.projectId(), 'config'], {
      fragment: 'integrations',
    });
  }

  /**
   * Reset to diagram selector
   */
  resetSelection(): void {
    this.selectedDiagramType.set(null);
    this.diagramData.set(null);
    this.error.set(null);
    this.errorConfig.set(null);
  }

  /**
   * Dismiss error (for INVALID_OPTIONS)
   */
  dismissError(): void {
    console.log('[DIAGRAM GENERATOR] Dismissing error');
    this.error.set(null);
    this.errorConfig.set(null);
    this.selectedDiagramType.set(null);
  }

  /**
   * Execute action based on error type
   */
  executeErrorAction(): void {
    const config = this.errorConfig();
    if (!config) return;

    console.log('[DIAGRAM GENERATOR] Executing error action:', config.action);

    switch (config.action) {
      case 'dismiss':
        this.dismissError();
        break;
      case 'navigate_to_settings':
        this.goToGitHubSettings();
        break;
      case 'retry':
        this.retry();
        break;
      case 'retry_and_report':
        // For now, just retry. Report functionality can be added later
        this.retry();
        break;
    }
  }

  /**
   * Track elapsed time during generation
   */
  private startElapsedTimeTracking(): void {
    const interval = setInterval(() => {
      if (!this.isLoading()) {
        clearInterval(interval);
        return;
      }

      const elapsed = Math.floor((Date.now() - this.loadingStartTime()) / 1000);
      this.elapsedTime.set(elapsed);

      // Warning if taking too long (>30 seconds)
      if (elapsed === 30) {
        this.notificationService.error('Diagram generation is taking longer ' +
          'than expected...');
      }
    }, 1000);
  }

  /**
   * Get repository info for display
   */
  getRepositoryInfo(): string {
    const integration = this.integration();
    if (!integration) return '';

    return integration.repository_full_name || 'Unknown repository';
  }
}
