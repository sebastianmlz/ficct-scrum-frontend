import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ArchitectureDiagramData, DiagramFormat } from '../../../../core/models/interfaces';
import { DiagramExportDropdownComponent } from '../../../../shared/components/diagram-export-dropdown/diagram-export-dropdown.component';
import { DiagramErrorStateComponent } from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import { DiagramErrorState, analyzeDiagramError, logDiagramError } from '../../../../shared/utils/diagram-error.utils';

@Component({
  selector: 'app-architecture-diagram',
  standalone: true,
  imports: [CommonModule, DiagramExportDropdownComponent, DiagramErrorStateComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-3">
              <button type="button" (click)="goBack()" class="p-2 rounded-md text-gray-400 hover:text-gray-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Architecture Diagram</h1>
            </div>
            <div class="w-full sm:w-auto">
              <app-diagram-export-dropdown
                [disabled]="loading() || (!diagramData() && !safeSvgContent())"
                [exporting]="exporting"
                (exportFormat)="onExportFormat($event)">
              </app-diagram-export-dropdown>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Generating architecture diagram...</p>
              </div>
            </div>
          } @else if (errorState()) {
            <!-- Error State -->
            <div class="p-6">
              <app-diagram-error-state [errorState]="errorState()!" (retry)="retryLoadDiagram()"></app-diagram-error-state>
            </div>
          } @else if (safeSvgContent()) {
            <!-- SVG Content (rendered by backend) -->
            <div class="p-4 md:p-6">
              <div class="mb-4">
                <p class="text-sm text-gray-600">
                  System architecture and component relationships.
                </p>
              </div>
              <div class="w-full mx-auto bg-gray-50 rounded-lg p-4">
                <div class="diagram-svg-container" [innerHTML]="safeSvgContent()"></div>
              </div>
            </div>
          } @else if (diagramData()) {
            <!-- JSON Data Visualization -->
            <div class="p-6 space-y-6">
              @if (diagramData()!.technologies) {
                <div class="border rounded-lg p-4 bg-blue-50">
                  <h3 class="font-medium text-blue-900 mb-3">Technology Stack</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    @if (diagramData()!.technologies.frontend) {
                      <div>
                        <div class="text-xs text-blue-700 font-medium mb-1">Frontend</div>
                        @for (tech of diagramData()!.technologies.frontend; track tech) {
                          <div class="text-sm text-blue-900">{{ tech }}</div>
                        }
                      </div>
                    }
                    @if (diagramData()!.technologies.backend) {
                      <div>
                        <div class="text-xs text-blue-700 font-medium mb-1">Backend</div>
                        @for (tech of diagramData()!.technologies.backend; track tech) {
                          <div class="text-sm text-blue-900">{{ tech }}</div>
                        }
                      </div>
                    }
                    @if (diagramData()!.technologies.database) {
                      <div>
                        <div class="text-xs text-blue-700 font-medium mb-1">Database</div>
                        @for (tech of diagramData()!.technologies.database; track tech) {
                          <div class="text-sm text-blue-900">{{ tech }}</div>
                        }
                      </div>
                    }
                    @if (diagramData()!.technologies.infrastructure) {
                      <div>
                        <div class="text-xs text-blue-700 font-medium mb-1">Infrastructure</div>
                        @for (tech of diagramData()!.technologies.infrastructure; track tech) {
                          <div class="text-sm text-blue-900">{{ tech }}</div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              @for (layer of diagramData()!.layers; track layer.name) {
                <div class="border rounded-lg p-4">
                  <h3 class="font-medium text-gray-900 mb-3">{{ layer.name }}</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    @for (component of layer.components; track component.id) {
                      <div class="border rounded p-3 bg-gray-50">
                        <div class="font-medium text-gray-900">{{ component.name }}</div>
                        @if (component.description) {
                          <div class="text-xs text-gray-600 mt-1">{{ component.description }}</div>
                        }
                        @if (component.technology) {
                          <div class="flex flex-wrap gap-1 mt-2">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {{ component.technology }}
                            </span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              @if (diagramData()!.connections && diagramData()!.connections.length > 0) {
                <div class="border rounded-lg p-4">
                  <h3 class="font-medium text-gray-900 mb-3">Connections ({{ diagramData()!.connections.length }})</h3>
                  <div class="space-y-2">
                    @for (conn of diagramData()!.connections; track conn.from + conn.to) {
                      <div class="flex items-center text-sm">
                        <span class="text-gray-700">{{ conn.from }}</span>
                        <svg class="h-4 w-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                        <span class="text-gray-700">{{ conn.to }}</span>
                        @if (conn.protocol) {
                          <span class="ml-2 text-xs text-gray-500">({{ conn.protocol }})</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Empty State -->
            <div class="p-6 text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No architecture diagram available</h3>
            </div>
          }
        </div>
      </div>
    </div>
  `,
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
  `]
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

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
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
    
    this.diagramService.generateArchitectureDiagram(this.projectId(), 'json').subscribe({
      next: (response) => {
        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');
        
        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(response.data));
            this.diagramData.set(null);
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data
          if (typeof response.data === 'string') {
            this.diagramData.set(JSON.parse(response.data));
          } else {
            this.diagramData.set(response.data as ArchitectureDiagramData);
          }
          this.safeSvgContent.set(null);
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('ARCHITECTURE-DIAGRAM', error);
        const errorInfo = analyzeDiagramError(error, this.projectId());
        this.errorState.set(errorInfo);
        this.loading.set(false);
      }
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
      format
    ).subscribe({
      next: (result) => {
        this.exporting.set(false);
        if (result.success) {
          this.notificationService.success(
            'Export Successful',
            `Architecture diagram exported as ${format.toUpperCase()}: ${result.filename}`
          );
        } else {
          this.notificationService.error(
            'Export Failed',
            result.error || 'An unexpected error occurred'
          );
        }
      },
      error: () => {
        this.exporting.set(false);
        this.notificationService.error(
          'Export Failed',
          'Unable to export diagram. Please try again.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
