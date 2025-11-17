import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DiagramService } from '../../../../core/services/diagram.service';
import { DiagramRendererService } from '../../../../core/services/diagram-renderer.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DiagramResponse, DiagramFormat } from '../../../../core/models/interfaces';
import { WorkflowDiagramData } from '../../../../core/models/diagram.interfaces';
import { DiagramErrorStateComponent } from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import { DiagramControlsComponent } from '../../../../shared/components/diagram-controls/diagram-controls.component';
import { DiagramErrorState, analyzeDiagramError, logDiagramError } from '../../../../shared/utils/diagram-error.utils';
import * as d3 from 'd3';

@Component({
  selector: 'app-workflow-diagram',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent, DiagramControlsComponent],
  templateUrl: './workflow-diagram.component.html',
  styleUrls: ['./workflow-diagram.component.scss']
})
export class WorkflowDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') svgContainer!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private diagramRenderer = inject(DiagramRendererService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  projectId = signal<string>('');
  diagramData = signal<WorkflowDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  loading = signal(false);
  errorState = signal<DiagramErrorState | null>(null);
  
  // Zoom and pan controls for SVG
  svgZoom = signal(1);
  svgPanX = signal(0);
  svgPanY = signal(0);
  
  // Fullscreen mode
  isFullscreen = signal(false);
  
  // Cache status from backend
  cacheStatus = signal<{cached: boolean, age?: number, generationTime?: number} | null>(null);
  
  // Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private initialPanX = 0;
  private initialPanY = 0;
  
  private svg: any;
  private simulation: any;

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDiagram();
        
        // Listen for pan mouse events
        document.addEventListener('mousemove', this.onPanMove.bind(this));
        document.addEventListener('mouseup', this.onPanEnd.bind(this));
      }
    });
  }

  ngAfterViewInit(): void {
    // SVG will be initialized after diagram loads
  }

  loadDiagram(): void {
    this.loading.set(true);
    this.errorState.set(null);
    
    this.diagramService.generateWorkflowDiagram(this.projectId(), 'json').subscribe({
      next: (response: DiagramResponse) => {
        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');
        
        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            console.log('[WORKFLOW-DIAGRAM] 📝 Raw SVG length:', response.data.length);
            
            // CRITICAL: Unescape the SVG string from JSON
            let svgString = response.data;
            
            // Replace escaped newlines with actual newlines
            svgString = svgString.replace(/\\n/g, '\n');
            
            // Replace escaped quotes with actual quotes
            svgString = svgString.replace(/\\"/g, '"');
            
            // Replace escaped backslashes
            svgString = svgString.replace(/\\\\/g, '\\');
            
            console.log('[WORKFLOW-DIAGRAM] 📝 Unescaped SVG length:', svgString.length);
            console.log('[WORKFLOW-DIAGRAM] 📝 First 200 chars:', svgString.substring(0, 200));
            
            // Strip fixed width/height attributes to make SVG responsive
            const responsiveSvg = this.makeResponsive(svgString);
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(responsiveSvg));
            this.diagramData.set(null); // Clear D3 data
            // Reset zoom/pan
            this.resetZoom();
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data for D3 rendering - handle double-encoded JSON
          try {
            const parsedData = this.parseDiagramData(response.data);
            console.log('[WORKFLOW-DIAGRAM] 📊 Parsed data:', parsedData);
            
            // Validate structure
            if (!parsedData.nodes || !parsedData.edges) {
              throw new Error('Invalid diagram data structure: missing nodes or edges');
            }
            
            this.diagramData.set(parsedData as WorkflowDiagramData);
            this.safeSvgContent.set(null); // Clear SVG content
            setTimeout(() => this.renderDiagram(), 100);
          } catch (parseError: any) {
            console.error('[WORKFLOW-DIAGRAM] ❌ Parse error:', parseError);
            console.error('[WORKFLOW-DIAGRAM] Raw data type:', typeof response.data);
            this.errorState.set(analyzeDiagramError(parseError, this.projectId()));
          }
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('WORKFLOW-DIAGRAM', error);
        this.errorState.set(analyzeDiagramError(error, this.projectId()));
        this.loading.set(false);
      }
    });
  }

  retryLoadDiagram(): void {
    this.loadDiagram();
  }

  renderDiagram(): void {
    const data = this.diagramData();
    if (!data || !this.svgContainer) {
      console.log('[WORKFLOW-DIAGRAM] Cannot render: missing data or container');
      return;
    }

    console.log('[WORKFLOW-DIAGRAM] Rendering with DiagramRendererService');
    const containerId = this.svgContainer.nativeElement.id || 'workflow-diagram-container';
    
    // Ensure container has an ID for D3 selection
    if (!this.svgContainer.nativeElement.id) {
      this.svgContainer.nativeElement.id = containerId;
    }

    try {
      this.diagramRenderer.renderWorkflowDiagram(containerId, data);
      console.log('[WORKFLOW-DIAGRAM] Diagram rendered successfully');
    } catch (error) {
      console.error('[WORKFLOW-DIAGRAM] Rendering error:', error);
      this.notificationService.error('Rendering Error', 'Failed to render workflow diagram');
    }
  }

  // Diagram control handlers
  onZoomIn(): void {
    console.log('[WORKFLOW-DIAGRAM] Zoom in clicked');
    // D3 zoom is handled internally by DiagramRendererService
  }

  onZoomOut(): void {
    console.log('[WORKFLOW-DIAGRAM] Zoom out clicked');
    // D3 zoom is handled internally by DiagramRendererService
  }

  onResetZoom(): void {
    console.log('[WORKFLOW-DIAGRAM] Reset zoom clicked');
    const containerId = this.svgContainer?.nativeElement.id || 'workflow-diagram-container';
    this.diagramRenderer.resetZoom(containerId);
  }

  onExportSVGDiagram(): void {
    console.log('[WORKFLOW-DIAGRAM] Export SVG clicked');
    const containerId = this.svgContainer?.nativeElement.id || 'workflow-diagram-container';
    const filename = `workflow-diagram-${this.projectId()}-${Date.now()}.svg`;
    this.diagramRenderer.exportToSVG(containerId, filename);
    this.notificationService.success('Export Successful', 'Diagram exported as SVG');
  }

  onExportPNGDiagram(): void {
    console.log('[WORKFLOW-DIAGRAM] Export PNG clicked');
    const containerId = this.svgContainer?.nativeElement.id || 'workflow-diagram-container';
    const filename = `workflow-diagram-${this.projectId()}-${Date.now()}.png`;
    this.diagramRenderer.exportToPNG(containerId, filename, 2);
    this.notificationService.success('Export Successful', 'Diagram exported as PNG');
  }


  /**
   * Make SVG responsive by removing fixed width/height attributes
   * and ensuring viewBox is present for aspect ratio preservation
   * CRITICAL FIX: Strips all dimension attributes and forces responsive CSS
   */
  makeResponsive(svgString: string): string {
    console.log('[WORKFLOW-DIAGRAM] 🔧 Making SVG responsive');
    console.log('[WORKFLOW-DIAGRAM] Original SVG length:', svgString.length);
    
    // Parse SVG to extract viewBox if exists
    const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
    const widthMatch = svgString.match(/width="([^"]+)"/);
    const heightMatch = svgString.match(/height="([^"]+)"/);
    
    console.log('[WORKFLOW-DIAGRAM] Extracted attributes:', {
      viewBox: viewBoxMatch?.[1],
      width: widthMatch?.[1],
      height: heightMatch?.[1]
    });
    
    let modifiedSvg = svgString;
    
    // If viewBox doesn't exist but width/height do, create viewBox from them
    if (!viewBoxMatch && widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      const viewBox = `0 0 ${width} ${height}`;
      modifiedSvg = modifiedSvg.replace('<svg', `<svg viewBox="${viewBox}"`);
      console.log('[WORKFLOW-DIAGRAM] ✅ Added viewBox:', viewBox);
    }
    
    // CRITICAL: Remove ALL fixed width and height attributes using multiple patterns
    modifiedSvg = modifiedSvg.replace(/\s*width="[\d.]+"/gi, '');
    modifiedSvg = modifiedSvg.replace(/\s*height="[\d.]+"/gi, '');
    modifiedSvg = modifiedSvg.replace(/\s*width='[\d.]+'/gi, '');
    modifiedSvg = modifiedSvg.replace(/\s*height='[\d.]+'/gi, '');
    
    // Remove width/height from style attributes as well
    modifiedSvg = modifiedSvg.replace(/width:\s*[\d.]+px;?/gi, '');
    modifiedSvg = modifiedSvg.replace(/height:\s*[\d.]+px;?/gi, '');
    
    // Add responsive CSS classes - FORCE width 100% and height auto
    if (!modifiedSvg.includes('class="responsive-svg"')) {
      modifiedSvg = modifiedSvg.replace(
        '<svg',
        '<svg class="responsive-svg" style="width: 100% !important; height: auto !important; display: block !important;"'
      );
    }
    
    console.log('[WORKFLOW-DIAGRAM] ✅ SVG made responsive');
    console.log('[WORKFLOW-DIAGRAM] ViewBox preserved:', viewBoxMatch?.[1] || 'created from dimensions');
    return modifiedSvg;
  }

  /**
   * Parse diagram data - handles double-encoded JSON string from backend
   */
  private parseDiagramData(data: any): any {
    console.log('[WORKFLOW-DIAGRAM] 🔍 Parsing data, type:', typeof data);
    
    if (data === null || data === undefined) {
      throw new Error('Diagram data is null or undefined');
    }
    
    // If data is a string, parse it as JSON
    if (typeof data === 'string') {
      console.log('[WORKFLOW-DIAGRAM] 📝 Data is string, parsing with JSON.parse');
      console.log('[WORKFLOW-DIAGRAM] First 100 chars:', data.substring(0, 100));
      try {
        const parsed = JSON.parse(data);
        console.log('[WORKFLOW-DIAGRAM] ✅ Successfully parsed JSON');
        return parsed;
      } catch (error: any) {
        console.error('[WORKFLOW-DIAGRAM] ❌ JSON parse failed:', error.message);
        throw new Error(`Failed to parse diagram JSON: ${error.message}`);
      }
    }
    
    // If data is already an object, return it directly
    if (typeof data === 'object') {
      console.log('[WORKFLOW-DIAGRAM] ✅ Data is already object');
      return data;
    }
    
    throw new Error(`Unsupported data type: ${typeof data}`);
  }

  /**
   * Zoom controls
   */
  zoomIn(): void {
    this.svgZoom.update(z => Math.min(z + 0.25, 3));
    console.log('[WORKFLOW-DIAGRAM] Zoom in:', this.svgZoom());
  }

  zoomOut(): void {
    this.svgZoom.update(z => Math.max(z - 0.25, 0.5));
    console.log('[WORKFLOW-DIAGRAM] Zoom out:', this.svgZoom());
  }

  resetZoom(): void {
    this.svgZoom.set(1);
    this.svgPanX.set(0);
    this.svgPanY.set(0);
    console.log('[WORKFLOW-DIAGRAM] Zoom reset');
  }

  fitToScreen(): void {
    this.svgZoom.set(1);
    this.svgPanX.set(0);
    this.svgPanY.set(0);
    console.log('[WORKFLOW-DIAGRAM] Fit to screen');
  }

  /**
   * Fit diagram to viewport width
   */
  fitToWidth(): void {
    // Calculate zoom based on container width
    // For now, reset to default view
    this.svgZoom.set(1);
    this.svgPanX.set(0);
    this.svgPanY.set(0);
    console.log('[WORKFLOW-DIAGRAM] Fit to width');
  }

  /**
   * View diagram at actual size (100%)
   */
  actualSize(): void {
    this.svgZoom.set(1);
    this.svgPanX.set(0);
    this.svgPanY.set(0);
    console.log('[WORKFLOW-DIAGRAM] Actual size (100%)');
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    this.isFullscreen.update(fs => !fs);
    console.log('[WORKFLOW-DIAGRAM] Fullscreen:', this.isFullscreen());
  }

  /**
   * Pan support - start pan on mousedown
   */
  onPanStart(event: MouseEvent): void {
    if (this.svgZoom() > 1) {
      this.isPanning = true;
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.initialPanX = this.svgPanX();
      this.initialPanY = this.svgPanY();
      event.preventDefault();
    }
  }

  /**
   * Pan support - move while dragging
   */
  private onPanMove(event: MouseEvent): void {
    if (this.isPanning) {
      const deltaX = event.clientX - this.panStartX;
      const deltaY = event.clientY - this.panStartY;
      this.svgPanX.set(this.initialPanX + deltaX / this.svgZoom());
      this.svgPanY.set(this.initialPanY + deltaY / this.svgZoom());
    }
  }

  /**
   * Pan support - end pan on mouseup
   */
  private onPanEnd(event: MouseEvent): void {
    this.isPanning = false;
  }

  /**
   * Refresh diagram with force_refresh parameter
   */
  refreshDiagram(): void {
    console.log('[WORKFLOW-DIAGRAM] 🔄 Refreshing diagram with force_refresh');
    // Clear current diagram
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    // Load diagram with cache bust
    this.loadDiagramWithCacheBust();
  }

  /**
   * Load diagram with cache busting parameter
   */
  loadDiagramWithCacheBust(): void {
    this.loading.set(true);
    this.errorState.set(null);
    
    console.log('[WORKFLOW-DIAGRAM] 📅 Force refresh: true');
    
    // Pass forceRefresh=true to backend
    this.diagramService.generateWorkflowDiagram(this.projectId(), 'json', true).subscribe({
      next: (response: DiagramResponse) => {
        console.log('[WORKFLOW-DIAGRAM] ✅ Fresh diagram received (cache busted)');
        console.log('[WORKFLOW-DIAGRAM] Response format:', response.format);
        console.log('[WORKFLOW-DIAGRAM] Cached?:', (response as any).cached);
        
        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');
        
        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            // CRITICAL: Unescape the SVG string from JSON
            let svgString = response.data;
            svgString = svgString.replace(/\\n/g, '\n');
            svgString = svgString.replace(/\\"/g, '"');
            svgString = svgString.replace(/\\\\/g, '\\');
            
            // Strip fixed width/height attributes to make SVG responsive
            const responsiveSvg = this.makeResponsive(svgString);
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(responsiveSvg));
            this.diagramData.set(null); // Clear D3 data
            // Reset zoom/pan
            this.resetZoom();
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data for D3 rendering - handle double-encoded JSON
          try {
            const parsedData = this.parseDiagramData(response.data);
            console.log('[WORKFLOW-DIAGRAM] 📊 Parsed refreshed data:', parsedData);
            
            // Validate structure
            if (!parsedData.nodes || !parsedData.edges) {
              throw new Error('Invalid diagram data structure: missing nodes or edges');
            }
            
            this.diagramData.set(parsedData as WorkflowDiagramData);
            this.safeSvgContent.set(null); // Clear SVG content
            setTimeout(() => this.renderDiagram(), 100);
          } catch (parseError: any) {
            console.error('[WORKFLOW-DIAGRAM] ❌ Parse error on refresh:', parseError);
            console.error('[WORKFLOW-DIAGRAM] Raw data type:', typeof response.data);
            this.errorState.set(analyzeDiagramError(parseError, this.projectId()));
          }
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('WORKFLOW-DIAGRAM', error);
        this.errorState.set(analyzeDiagramError(error, this.projectId()));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    document.removeEventListener('mousemove', this.onPanMove.bind(this));
    document.removeEventListener('mouseup', this.onPanEnd.bind(this));
  }
}
