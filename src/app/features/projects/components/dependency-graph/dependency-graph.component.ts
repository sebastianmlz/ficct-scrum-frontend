import {Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiagramService} from '../../../../core/services/diagram.service';
import {DiagramRendererService} from '../../../../core/services/diagram-renderer.service';
import {NotificationService} from '../../../../core/services/notification.service';
import {DependencyDiagramData, DiagramFormat} from '../../../../core/models/interfaces';
import {DiagramErrorStateComponent} from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError} from '../../../../shared/utils/diagram-error.utils';
import {DiagramFilterPanelComponent, DiagramFilters} from '../diagram-filter-panel/diagram-filter-panel.component';

@Component({
  selector: 'app-dependency-graph',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent, DiagramFilterPanelComponent],
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
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Dependency Graph</h1>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <button (click)="toggleFilters()" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                {{ showFilters() ? 'Hide' : 'Show' }} Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Panel -->
        @if (showFilters()) {
          <app-diagram-filter-panel
            [projectId]="projectId()"
            (filtersChanged)="onFiltersChanged($event)">
          </app-diagram-filter-panel>
        }

        <div class="bg-white shadow rounded-lg overflow-hidden">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Generating dependency graph...</p>
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
                <p class="text-sm text-gray-600">Issue dependencies and critical path visualization</p>
              </div>
              <div class="w-full mx-auto bg-gray-50 rounded-lg p-4">
                <div class="diagram-svg-container" [innerHTML]="safeSvgContent()"></div>
              </div>
            </div>
          } @else if (diagramData()) {
            <!-- JSON Data Visualization -->
            <div class="p-6">
              <div class="mb-4">
                <p class="text-sm text-gray-600">Issue dependencies and critical path visualization</p>
              </div>
              <!-- D3 Interactive Diagram Container -->
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">{{ diagramData()?.nodes?.length || 0 }} Issues • {{ diagramData()?.links?.length || 0 }} Dependencies</p>
                  @if (diagramData()?.critical_path && diagramData()!.critical_path!.length > 0) {
                    <p class="text-xs text-blue-600 font-medium">Critical Path: {{ diagramData()!.critical_path!.length }} issues</p>
                  }
                </div>
              </div>
              <div id="dependency-graph-container" #diagramContainer class="bg-gray-50 rounded-lg border border-gray-200" style="min-height: 600px; width: 100%; position: relative;">
                @if (isRendering()) {
                  <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p class="text-sm text-gray-600">Rendering diagram...</p>
                    </div>
                  </div>
                }

                <!-- Floating Controls -->
                <div style="position: absolute; top: 20px; right: 20px; z-index: 10;">
                  <div style="display: flex; align-items: center; gap: 8px; background: white; border-radius: 8px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 1px solid #DFE1E6;">

                    <!-- Export Menu -->
                    <div style="position: relative;">
                      <button (click)="toggleExportMenu()" [disabled]="loading() || exporting()" title="Export"
                              style="display: flex; align-items: center; gap: 4px; padding: 8px; background: transparent; border: none; border-radius: 4px; cursor: pointer; color: #42526E;"
                              class="hover:bg-gray-100">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        <span style="font-size: 14px;">Export</span>
                      </button>

                      @if (showExportMenu()) {
                        <div style="position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #DFE1E6; min-width: 180px; overflow: hidden; z-index: 20;">
                          <button (click)="viewDiagram()" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; background: transparent; border: none; cursor: pointer; color: #172B4D; text-align: left;"
                                  class="hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            <span style="font-size: 14px;">View in New Tab</span>
                          </button>
                          <button (click)="exportDiagram('svg')" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; background: transparent; border: none; cursor: pointer; color: #172B4D; text-align: left;"
                                  class="hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                            <span style="font-size: 14px;">Download SVG</span>
                          </button>
                          <button (click)="exportDiagramAsPNG()" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; background: transparent; border: none; cursor: pointer; color: #172B4D; text-align: left;"
                                  class="hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span style="font-size: 14px;">Download PNG</span>
                          </button>
                        </div>
                      }
                    </div>

                    <div style="width: 1px; height: 24px; background: #DFE1E6;"></div>

                    <!-- Refresh -->
                    <button (click)="refreshDiagram()" [disabled]="loading()" title="Refresh"
                            style="display: flex; align-items: center; padding: 8px; background: transparent; border: none; border-radius: 4px; cursor: pointer; color: #42526E;"
                            class="hover:bg-gray-100">
                      <svg class="w-5 h-5" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No diagram available</h3>
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

    /* CRITICAL: Container sizing and overflow for dependency cards */
    .diagram-svg-container {
      position: relative;
      min-height: 600px;
      width: 100%;
      overflow-x: auto; /* Enable horizontal scroll if needed */
      overflow-y: visible;
      background: #ffffff;
      border-radius: 8px;
      padding: 16px;
      -webkit-overflow-scrolling: touch;
    }

    .diagram-svg-container svg {
      width: 100% !important;
      max-width: none !important; /* Allow wider than container */
      min-width: 100%;
      height: auto !important;
      display: block !important;
    }

    /* CRITICAL: Override backend SVG text styling for visibility */
    .diagram-svg-container svg text {
      fill: #172B4D !important; /* Backend primary text color */
      font-weight: 600 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important; /* Minimum font size */
      paint-order: stroke fill !important;
      stroke: #ffffff !important;
      stroke-width: 2px !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
    }

    .diagram-svg-container svg tspan {
      fill: #172B4D !important;
      stroke: #ffffff !important;
      stroke-width: 2px !important;
      font-size: 12px !important;
    }

    /* Text inside dark backgrounds needs white fill */
    .diagram-svg-container svg rect[fill*="#00"] ~ text,
    .diagram-svg-container svg rect[fill*="#5E"] ~ text,
    .diagram-svg-container svg rect[fill*="#00875A"] ~ text,
    .diagram-svg-container svg rect[fill*="#0052CC"] ~ text,
    .diagram-svg-container svg rect[fill*="#DE350B"] ~ text,
    .diagram-svg-container svg rect[fill*="#00"] ~ g text,
    .diagram-svg-container svg rect[fill*="#5E"] ~ g text {
      fill: #ffffff !important;
      stroke: rgba(0, 0, 0, 0.3) !important;
      stroke-width: 1px !important;
    }

    .diagram-svg-container svg rect,
    .diagram-svg-container svg circle,
    .diagram-svg-container svg ellipse,
    .diagram-svg-container svg polygon {
      stroke-width: 2px !important;
    }

    .diagram-svg-container svg rect[fill*="#"] {
      stroke: rgba(0, 0, 0, 0.15) !important;
    }

    .diagram-svg-container svg line,
    .diagram-svg-container svg polyline,
    .diagram-svg-container svg path[stroke] {
      stroke: #6b7280 !important;
      stroke-width: 2px !important;
    }

    /* Enhance contrast */
    .diagram-svg-container svg {
      filter: contrast(1.05) brightness(1.02);
    }

    /* Card layout for JSON data visualization */
    .dependency-visualization {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: flex-start;
    }
  `],
})
export class DependencyGraphComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private diagramRenderer = inject(DiagramRendererService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('diagramContainer') diagramContainer?: ElementRef;

  projectId = signal<string>('');
  diagramData = signal<DependencyDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  errorState = signal<DiagramErrorState | null>(null);
  loading = signal(false);
  isRendering = signal(false);
  hasRendered = signal(false);
  exporting = signal(false);
  showExportMenu = signal(false);
  renderError = signal<string | null>(null);
  showFilters = signal(true);
  currentFilters = signal<DiagramFilters | null>(null);

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDiagram();
      }
    });
  }

  ngAfterViewInit(): void {
    // Trigger rendering if data already loaded
    const data = this.diagramData();
    if (data && !this.hasRendered()) {
      console.log('[DEPENDENCY-GRAPH] 🔄 AfterViewInit: Data exists, triggering render');
      setTimeout(() => this.renderDiagram(), 100);
    }
  }

  loadDiagram(): void {
    this.loading.set(true);
    this.errorState.set(null);
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    this.hasRendered.set(false);
    this.renderError.set(null);

    console.log('[DEPENDENCY-GRAPH] 📥 Loading diagram with filters:', this.currentFilters());

    // Build parameters object with filters
    const parameters = this.currentFilters() || {};

    this.diagramService.generateDiagram({
      diagram_type: 'dependency',
      project: this.projectId(),
      format: 'json',
      parameters: parameters,
    }).subscribe({
      next: (response) => {
        console.log('[DEPENDENCY-GRAPH] 📦 Response received, format:', response.format, 'data type:', typeof response.data);

        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');

        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            console.log('[DEPENDENCY-GRAPH] 🖼️ Rendering SVG directly');
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(response.data));
            this.diagramData.set(null);
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data - handle both object and string
          try {
            const parsedData = this.parseDiagramData(response.data);
            console.log('[DEPENDENCY-GRAPH] 📊 Parsed data:', {
              type: parsedData.diagram_type,
              nodes: parsedData.nodes?.length || 0,
              links: parsedData.links?.length || 0,
            });

            // Comprehensive structure validation
            if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
              console.error('[DEPENDENCY-GRAPH] ❌ Invalid nodes:', parsedData.nodes);
              throw new Error('Invalid diagram data structure: missing or invalid nodes array');
            }

            if (!parsedData.links || !Array.isArray(parsedData.links)) {
              console.warn('[DEPENDENCY-GRAPH] ⚠️ Missing or invalid links array, defaulting to empty');
              parsedData.links = [];
            }

            console.log('[DEPENDENCY-GRAPH] ✅ Validation passed:', {
              nodes: parsedData.nodes.length,
              links: parsedData.links.length,
              hasCriticalPath: !!parsedData.critical_path,
              hasLayout: !!parsedData.layout,
            });

            this.diagramData.set(parsedData as DependencyDiagramData);
            this.safeSvgContent.set(null);

            // CRITICAL: Trigger rendering after data is set
            console.log('[DEPENDENCY-GRAPH] 🎨 Data ready, scheduling render');
            setTimeout(() => this.renderDiagram(), 100);
          } catch (parseError: any) {
            console.error('[DEPENDENCY-GRAPH] ❌ Parse error:', parseError);
            console.error('[DEPENDENCY-GRAPH] Raw data type:', typeof response.data);
            this.errorState.set(analyzeDiagramError(parseError, this.projectId()));
          }
        }

        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('DEPENDENCY-GRAPH', error);
        const errorInfo = analyzeDiagramError(error, this.projectId());
        this.errorState.set(errorInfo);
        this.loading.set(false);
      },
    });
  }

  /**
   * Parse diagram data - handles both object and string from backend
   * UPDATED: Backend now returns clean objects (not JSON strings)
   */
  private parseDiagramData(data: any): any {
    console.log('[DEPENDENCY-GRAPH] 🔍 Parsing data, type:', typeof data);

    if (data === null || data === undefined) {
      throw new Error('Diagram data is null or undefined');
    }

    // NEW: If data is already an object, return it directly (backend sends clean objects now)
    if (typeof data === 'object') {
      console.log('[DEPENDENCY-GRAPH] ✅ Data is object (backend clean format)');
      return data;
    }

    // BACKWARD COMPATIBLE: If data is a string, parse it as JSON (for transition period)
    if (typeof data === 'string') {
      console.log('[DEPENDENCY-GRAPH] 📝 Data is string (legacy format), parsing with JSON.parse');
      console.log('[DEPENDENCY-GRAPH] First 100 chars:', data.substring(0, 100));
      try {
        const parsed = JSON.parse(data);
        console.log('[DEPENDENCY-GRAPH] ✅ Successfully parsed JSON string');
        return parsed;
      } catch (error: any) {
        console.error('[DEPENDENCY-GRAPH] ❌ JSON parse failed:', error.message);
        throw new Error(`Failed to parse diagram JSON: ${error.message}`);
      }
    }

    throw new Error(`Unsupported data type: ${typeof data}`);
  }

  /**
   * Render dependency graph using D3 renderer service
   * CRITICAL: Explicitly called after data is validated and ready
   */
  private renderDiagram(): void {
    const data = this.diagramData();

    if (!data) {
      console.warn('[DEPENDENCY-GRAPH] ⚠️ Cannot render: no data available');
      return;
    }

    // Verify container exists
    if (!this.diagramContainer) {
      console.error('[DEPENDENCY-GRAPH] ❌ Cannot render: container element not found');
      this.renderError.set('Diagram container not available');
      return;
    }

    const containerElement = this.diagramContainer.nativeElement;
    if (!containerElement) {
      console.error('[DEPENDENCY-GRAPH] ❌ Cannot render: container nativeElement is null');
      this.renderError.set('Diagram container element is null');
      return;
    }

    console.log('[DEPENDENCY-GRAPH] 🎭 Starting render:', {
      containerExists: !!containerElement,
      nodes: data.nodes?.length || 0,
      links: data.links?.length || 0,
      hasCriticalPath: !!data.critical_path,
    });

    try {
      this.isRendering.set(true);
      this.renderError.set(null);

      // Call renderer service with container ID
      this.diagramRenderer.renderDependencyGraph('dependency-graph-container', data as any);

      console.log('[DEPENDENCY-GRAPH] ✅ Rendering completed successfully');
      this.hasRendered.set(true);
      this.isRendering.set(false);

      // Force change detection
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('[DEPENDENCY-GRAPH] ❌ Rendering failed:', error);
      this.renderError.set(error.message || 'Rendering failed');
      this.isRendering.set(false);
      this.notificationService.error('Failed to render diagram: ' + error.message);
    }
  }

  /**
   * Retry loading diagram from API
   */
  retryLoadDiagram(): void {
    console.log('[DEPENDENCY-GRAPH] 🔄 Retrying diagram load');
    this.loadDiagram();
  }

  toggleExportMenu(): void {
    this.showExportMenu.update((show) => !show);
  }

  viewDiagram(): void {
    this.showExportMenu.set(false);
    this.exporting.set(true);

    // Use exportDiagram directly to get SVG content
    this.diagramService.exportDiagram({
      diagram_type: 'dependency',
      project: this.projectId(),
      format: 'svg',
    }).subscribe({
      next: (response) => {
        this.exporting.set(false);
        // response.data contains the SVG content
        const svgContent = typeof response.data === 'string' ? response.data : '';
        const blob = new Blob([svgContent], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.notificationService.success('Success', 'Diagram opened in new tab');
      },
      error: (error) => {
        this.exporting.set(false);
        console.error('[DEPENDENCY-GRAPH] View error:', error);
        this.notificationService.error('View Failed', 'Could not open diagram');
      },
    });
  }

  exportDiagram(format: 'svg' | 'png'): void {
    this.showExportMenu.set(false);
    this.exporting.set(true);

    this.diagramService.exportDiagramWithFormat(
        'dependency',
        this.projectId(),
        format,
    ).subscribe({
      next: (response) => {
        this.exporting.set(false);
        if (response.success) {
          this.notificationService.success('Export Successful', `Diagram exported as ${format.toUpperCase()}`);
        } else {
          this.notificationService.error('Export Failed', response.error || 'Could not export diagram');
        }
      },
      error: (error) => {
        this.exporting.set(false);
        console.error('[DEPENDENCY-GRAPH] Export error:', error);
        this.notificationService.error('Export Failed', error.error?.detail || 'Could not export diagram');
      },
    });
  }

  exportDiagramAsPNG(): void {
    this.showExportMenu.set(false);
    this.exporting.set(true);

    // First get SVG from backend
    this.diagramService.exportDiagram({
      diagram_type: 'dependency',
      project: this.projectId(),
      format: 'svg',
    }).subscribe({
      next: (response) => {
        // response.data contains the SVG content
        const svgContent = typeof response.data === 'string' ? response.data : '';
        if (svgContent) {
          // Convert SVG to PNG using canvas
          this.convertSVGToPNG(svgContent);
        } else {
          this.exporting.set(false);
          this.notificationService.error('Export Failed', 'Could not generate SVG');
        }
      },
      error: (error) => {
        this.exporting.set(false);
        console.error('[DEPENDENCY-GRAPH] PNG export error:', error);
        this.notificationService.error('Export Failed', 'Could not generate diagram');
      },
    });
  }

  private convertSVGToPNG(svgContent: string): void {
    try {
      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      if (!svgElement) {
        this.exporting.set(false);
        this.notificationService.error('Export Failed', 'Invalid SVG content');
        return;
      }

      // Get dimensions (use viewBox or default to reasonable size)
      const viewBox = svgElement.getAttribute('viewBox');
      let width = 1200;
      let height = 800;

      if (viewBox) {
        const parts = viewBox.split(' ');
        width = parseFloat(parts[2]) || 1200;
        height = parseFloat(parts[3]) || 800;
      } else if (svgElement.getAttribute('width')) {
        width = parseFloat(svgElement.getAttribute('width')!) || 1200;
        height = parseFloat(svgElement.getAttribute('height')!) || 800;
      }

      // Scale up for better quality (2x)
      const scale = 2;
      width = width * scale;
      height = height * scale;

      const img = new Image();
      const blob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.exporting.set(false);
          this.notificationService.error('Export Failed', 'Canvas not supported');
          URL.revokeObjectURL(url);
          return;
        }

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw SVG scaled
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to PNG and download
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `dependency-graph-${this.projectId()}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(pngUrl);
            this.exporting.set(false);
            this.notificationService.success('Export Successful', 'Diagram exported as PNG');
          } else {
            this.exporting.set(false);
            this.notificationService.error('Export Failed', 'Could not convert to PNG');
          }
        }, 'image/png');

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.notificationService.error('Export Failed', 'Could not load SVG image');
      };

      img.src = url;
    } catch (error) {
      console.error('[DEPENDENCY-GRAPH] PNG conversion error:', error);
      this.exporting.set(false);
      this.notificationService.error('Export Failed', 'SVG to PNG conversion failed');
    }
  }

  refreshDiagram(): void {
    console.log('[DEPENDENCY-GRAPH] 🔄 Refreshing diagram with force_refresh');
    // Clear current diagram
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    this.hasRendered.set(false);

    // Reload with current filters
    this.loadDiagram();
  }

  // ===========================
  // FILTER HANDLERS
  // ===========================

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  onFiltersChanged(filters: DiagramFilters): void {
    console.log('[DEPENDENCY-GRAPH] Filters changed:', filters);
    this.currentFilters.set(filters);
    this.loadDiagram();
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
