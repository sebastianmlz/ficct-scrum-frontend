import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiagramService} from '../../../../core/services/diagram.service';
import {NotificationService} from '../../../../core/services/notification.service';
import {ArchitectureDiagramData, DiagramFormat} from '../../../../core/models/interfaces';
import {DiagramExportDropdownComponent} from '../../../../shared/components/diagram-export-dropdown/diagram-export-dropdown.component';
import {DiagramErrorStateComponent} from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError} from '../../../../shared/utils/diagram-error.utils';

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
            <!-- JSON Data Visualization - NEW BACKEND STRUCTURE -->
            <div class="p-6">
              <!-- Header with Architecture Pattern and Cache -->
              <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div class="flex items-center justify-between">
                  <div>
                    @if (diagramData()!.architecture_pattern) {
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ diagramData()!.architecture_pattern }}</h3>
                    }
                    @if (diagramData()!.project) {
                      <p class="text-sm text-gray-600">{{ diagramData()?.project?.name ?? 'Unknown' }} ({{ diagramData()?.project?.key ?? '---' }})</p>
                    }
                  </div>
                  @if (cacheStatus()) {
                    <div class="text-right">
                      @if (cacheStatus() === 'HIT') {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                          Cached
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Fresh
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Layers - Vertical Layout -->
              @if (diagramData()!.layers && diagramData()!.layers.length > 0) {
                <div class="space-y-4">
                  @for (layer of diagramData()!.layers; track layer.name; let idx = $index) {
                    <div class="border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                         [class.border-blue-300]="idx === 0"
                         [class.border-green-300]="idx === 1"
                         [class.border-gray-300]="idx === 2">
                      <!-- Layer Header -->
                      <div class="p-4"
                           [class.bg-gradient-to-r]="true"
                           [class.from-blue-50]="idx === 0"
                           [class.to-blue-100]="idx === 0"
                           [class.from-green-50]="idx === 1"
                           [class.to-green-100]="idx === 1"
                           [class.from-gray-50]="idx === 2"
                           [class.to-gray-100]="idx === 2">
                        <div class="flex items-start gap-3">
                          <div class="flex-shrink-0 mt-1">
                            @if (idx === 0) {
                              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                              </svg>
                            } @else if (idx === 1) {
                              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                            } @else {
                              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                              </svg>
                            }
                          </div>
                          <div class="flex-1">
                            <h4 class="text-lg font-semibold text-gray-900">{{ layer.name }}</h4>
                            <p class="text-sm text-gray-600 mt-1">{{ layer.description }}</p>
                          </div>
                          <div class="flex-shrink-0">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                              {{ layer.components.length }} components
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Layer Components -->
                      @if (layer.components && layer.components.length > 0) {
                        <div class="p-4 bg-white border-t-2"
                             [class.border-blue-100]="idx === 0"
                             [class.border-green-100]="idx === 1"
                             [class.border-gray-100]="idx === 2">
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            @for (component of layer.components; track component.name) {
                              <div class="flex items-start gap-2 p-2.5 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                                      [class.bg-blue-100]="component.type === 'viewset'"
                                      [class.text-blue-700]="component.type === 'viewset'"
                                      [class.bg-purple-100]="component.type === 'serializer'"
                                      [class.text-purple-700]="component.type === 'serializer'"
                                      [class.bg-green-100]="component.type === 'service'"
                                      [class.text-green-700]="component.type === 'service'"
                                      [class.bg-gray-100]="component.type === 'model'"
                                      [class.text-gray-700]="component.type === 'model'"
                                      [class.bg-orange-100]="component.type === 'middleware'"
                                      [class.text-orange-700]="component.type === 'middleware'"
                                      [class.bg-teal-100]="component.type === 'manager'"
                                      [class.text-teal-700]="component.type === 'manager'"
                                      [class.bg-red-100]="component.type === 'admin'"
                                      [class.text-red-700]="component.type === 'admin'">
                                  {{ component.type }}
                                </span>
                                <div class="flex-1 min-w-0">
                                  <div class="text-sm font-medium text-gray-900 truncate">{{ component.name }}</div>
                                  <div class="text-xs text-gray-500">{{ component.app }}</div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Connection Arrow -->
                    @if (idx < diagramData()!.layers.length - 1) {
                      <div class="flex justify-center py-2">
                        <div class="flex flex-col items-center">
                          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                          </svg>
                          <span class="text-xs text-gray-500 mt-1">uses / accesses</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              <!-- Connections Detail -->
              @if (diagramData()!.connections && diagramData()!.connections.length > 0) {
                <div class="mt-6 border rounded-lg p-4 bg-gray-50">
                  <h3 class="font-medium text-gray-900 mb-3">Connections ({{ diagramData()!.connections.length }})</h3>
                  <div class="space-y-2">
                    @for (conn of diagramData()!.connections; track conn.from + conn.to) {
                      <div class="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                        <span class="font-medium text-gray-700">{{ conn.from }}</span>
                        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                        <span class="font-medium text-gray-700">{{ conn.to }}</span>
                        <span class="ml-auto text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{{ conn.type }}</span>
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

    console.log('[ARCHITECTURE] Loading diagram for project:', this.projectId());

    this.diagramService.generateArchitectureDiagram(this.projectId(), 'json').subscribe({
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
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(response.data));
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
              `Architecture diagram exported as ${format.toUpperCase()}: ${result.filename}`,
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
