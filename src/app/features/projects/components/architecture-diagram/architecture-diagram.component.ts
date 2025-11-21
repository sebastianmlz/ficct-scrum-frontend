import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiagramService} from '../../../../core/services/diagram.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {ArchitectureDiagramData, DiagramFormat}
  from '../../../../core/models/interfaces';
import {DiagramExportDropdownComponent} from
  '@components/diagram-export-dropdown/diagram-export-dropdown.component';
import {DiagramErrorStateComponent}
  from '@shared/components/diagram-error-state/diagram-error-state.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError}
  from '../../../../shared/utils/diagram-error.utils';

@Component({
  selector: 'app-architecture-diagram',
  standalone: true,
  imports: [CommonModule, DiagramExportDropdownComponent,
    DiagramErrorStateComponent],
  templateUrl: 'architecture-diagram.component.html',
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .diagram-svg-container svg {
      max-width: 100%;
      height: auto;
      display: block;
    }
  `],
})
export class ArchitectureDiagramComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  projectId = signal<string>('');
  diagramData = signal<ArchitectureDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  errorState = signal<DiagramErrorState | null>(null);
  loading = signal(false);
  exporting = signal(false);
  cacheStatus = signal<'HIT' | 'MISS' | null>(null);

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDiagram();
      }
    });
  }

  loadDiagram(): void {
    this.loading.set(true);
    this.errorState.set(null);
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    this.cacheStatus.set(null);

    console.log('[ARCHITECTURE] Loading diagram for project:',
        this.projectId());

    this.diagramService.generateArchitectureDiagram(this.projectId(),
        'json').subscribe({
      next: (response) => {
        console.log('[ARCHITECTURE] Response received:', response);

        // Parse cache status from response metadata
        if (response.cached !== undefined) {
          this.cacheStatus.set(response.cached ? 'HIT' : 'MISS');
        }

        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');

        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            this.safeSvgContent.set(this.sanitizer
                .bypassSecurityTrustHtml(response.data));
            this.diagramData.set(null);
            console.log('[ARCHITECTURE] SVG content rendered');
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data as STRING - MUST parse
          let parsed: ArchitectureDiagramData;
          if (typeof response.data === 'string') {
            parsed = JSON.parse(response.data);
          } else {
            parsed = response.data as ArchitectureDiagramData;
          }

          this.diagramData.set(parsed);
          this.safeSvgContent.set(null);

          console.log('[ARCHITECTURE] JSON parsed:', {
            pattern: parsed.architecture_pattern,
            layers: parsed.layers?.length || 0,
            connections: parsed.connections?.length || 0,
          });
        }

        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('ARCHITECTURE-DIAGRAM', error);
        const errorInfo = analyzeDiagramError(error, this.projectId());
        this.errorState.set(errorInfo);
        this.loading.set(false);
      },
    });
  }

  retryLoadDiagram(): void {
    this.loadDiagram();
  }

  onExportFormat(format: DiagramFormat): void {
    this.exporting.set(true);

    this.diagramService.exportDiagramWithFormat(
        'architecture',
        this.projectId(),
        format,
    ).subscribe({
      next: (result) => {
        this.exporting.set(false);
        if (result.success) {
          this.notificationService.success(
              'Export Successful',
              `Architecture diagram exported as ${format.toUpperCase()}: ${
                result.filename}`,
          );
        } else {
          this.notificationService.error(
              'Export Failed',
              result.error || 'An unexpected error occurred',
          );
        }
      },
      error: () => {
        this.exporting.set(false);
        this.notificationService.error(
            'Export Failed',
            'Unable to export diagram. Please try again.',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  // Visual rendering helper methods
  getLayerIcon(layerType: string): string {
    switch (layerType) {
      case 'frontend': return '🎨';
      case 'backend': return '⚙️';
      case 'database': return '🗄️';
      case 'infrastructure': return '☁️';
      case 'external': return '🔌';
      default: return '📦';
    }
  }

  getComponentInitials(componentName: string): string {
    return componentName
        .split(/[\s_-]/)
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
  }
}
