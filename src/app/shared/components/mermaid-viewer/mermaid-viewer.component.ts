import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  signal,
  inject,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';

declare const mermaid: any;
declare const html2canvas: any;

@Component({
  selector: 'app-mermaid-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mermaid-viewer.component.html',
  styleUrls: ['./mermaid-viewer.component.scss'],
})
export class MermaidViewerComponent implements OnInit, AfterViewInit {
  @Input() mermaidCode = '';
  @Input() title = 'Diagram';
  @Output() classSelected = new EventEmitter<string>();

  @ViewChild('mermaidContainer', {static: false}) containerRef?: ElementRef;

  // State
  isFullscreen = signal(false);
  zoomLevel = signal(100);
  isPanning = false;
  panStart = {x: 0, y: 0};
  pan = {x: 0, y: 0};
  isExporting = signal(false);

  // Mermaid ready flag
  private mermaidReady = false;

  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.loadMermaidLibrary();
  }

  ngAfterViewInit(): void {
    if (this.mermaidReady && this.mermaidCode) {
      this.renderMermaid();
    }
  }

  /**
   * Load Mermaid library from CDN
   */
  loadMermaidLibrary(): void {
    // Check if already loaded
    if (typeof mermaid !== 'undefined') {
      this.initializeMermaid();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = () => {
      console.log('[MERMAID-VIEWER] Library loaded');
      this.initializeMermaid();
    };
    script.onerror = () => {
      console.error('[MERMAID-VIEWER] Failed to load library');
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Mermaid configuration
   */
  initializeMermaid(): void {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
        },
      });
      this.mermaidReady = true;
      console.log('[MERMAID-VIEWER] Initialized');
    }
  }

  /**
   * Render Mermaid diagram
   */
  async renderMermaid(): Promise<void> {
    if (!this.mermaidReady || !this.mermaidCode || !this.containerRef) {
      return;
    }

    try {
      const container = this.containerRef.nativeElement;
      container.innerHTML = `<div class="mermaid">${this.mermaidCode}</div>`;

      // Render
      await mermaid.run({
        nodes: container.querySelectorAll('.mermaid'),
      });

      console.log('[MERMAID-VIEWER] Diagram rendered');

      // Setup interactions after render
      setTimeout(() => this.setupInteractions(), 300);
    } catch (e: any) {
      console.error('[MERMAID-VIEWER] Render error:', e);
    }
  }

  /**
   * Setup zoom, pan, and click interactions
   */
  setupInteractions(): void {
    const svg = this.containerRef?.nativeElement?.querySelector('svg');
    if (!svg) return;

    // Zoom with mouse wheel
    svg.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -10 : 10;
          this.zoomLevel.set(
              Math.max(50, Math.min(300, this.zoomLevel() + delta)),
          );
          this.applyTransform();
        },
        {passive: false},
    );

    // Pan with drag (Ctrl + mouse drag or right mouse button)
    svg.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 2 || e.ctrlKey) {
        // Right click or Ctrl
        this.isPanning = true;
        this.panStart = {
          x: e.clientX - this.pan.x,
          y: e.clientY - this.pan.y,
        };
        e.preventDefault();
      }
    });

    svg.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isPanning) {
        this.pan = {
          x: e.clientX - this.panStart.x,
          y: e.clientY - this.panStart.y,
        };
        this.applyTransform();
      }
    });

    svg.addEventListener('mouseup', () => {
      this.isPanning = false;
    });

    svg.addEventListener('mouseleave', () => {
      this.isPanning = false;
    });

    // Prevent context menu on right click
    svg.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    // Click on nodes
    const nodes = svg.querySelectorAll(
        '.node, .classNode, g[id^="node"], g[class*="node"]',
    );
    nodes.forEach((node: Element) => {
      (node as HTMLElement).style.cursor = 'pointer';
      node.addEventListener('click', (e: Event) => this.onNodeClick(e));
    });

    console.log(
        '[MERMAID-VIEWER] Interactions setup for',
        nodes.length,
        'nodes',
    );
  }

  /**
   * Apply transform (zoom + pan) to SVG
   */
  applyTransform(): void {
    const svg = this.containerRef?.nativeElement?.querySelector('svg');
    if (!svg) return;

    const scale = this.zoomLevel() / 100;
    svg.style.transform = `scale(${scale}) translate(${this.pan.x / scale}px, ${
      this.pan.y / scale
    }px)`;
    svg.style.transformOrigin = '0 0';
    svg.style.transition = 'none';
  }

  /**
   * Handle node click
   */
  onNodeClick(event: Event): void {
    event.stopPropagation();

    const target = (event.target as SVGElement).closest('g');
    if (target) {
      // Extract class name from node
      const textElement = target.querySelector('text, .nodeLabel, .label');
      if (textElement) {
        const className = textElement.textContent?.trim() || '';
        console.log('[MERMAID-VIEWER] Class clicked:', className);
        this.classSelected.emit(className);
      }
    }
  }

  // ========== CONTROL METHODS ==========

  zoomIn(): void {
    this.zoomLevel.set(Math.min(300, this.zoomLevel() + 20));
    this.applyTransform();
  }

  zoomOut(): void {
    this.zoomLevel.set(Math.max(50, this.zoomLevel() - 20));
    this.applyTransform();
  }

  resetView(): void {
    this.zoomLevel.set(100);
    this.pan = {x: 0, y: 0};
    this.applyTransform();
  }

  fitToScreen(): void {
    const svg = this.containerRef?.nativeElement?.querySelector('svg');
    const container = this.containerRef?.nativeElement;

    if (!svg || !container) return;

    // Get dimensions
    const svgBox = svg.getBBox();
    const containerRect = container.getBoundingClientRect();

    // Calculate scale to fit
    const scaleX = containerRect.width / svgBox.width;
    const scaleY = containerRect.height / svgBox.height;

    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% for margin
    this.zoomLevel.set(Math.round(scale * 100));
    this.pan = {x: 0, y: 0};
    this.applyTransform();
  }

  toggleFullscreen(): void {
    this.isFullscreen.set(!this.isFullscreen());
  }

  // ========== EXPORT METHODS ==========

  async exportDiagram(format: 'png' | 'svg' | 'json'): Promise<void> {
    const svg = this.containerRef?.nativeElement?.querySelector('svg');
    if (!svg) return;

    this.isExporting.set(true);

    try {
      if (format === 'svg') {
        await this.exportSVG(svg);
      } else if (format === 'png') {
        await this.exportPNG(svg);
      } else if (format === 'json') {
        await this.exportJSON();
      }
    } catch (e: any) {
      console.error('[MERMAID-VIEWER] Export failed:', e);
    } finally {
      this.isExporting.set(false);
    }
  }

  private async exportSVG(svg: SVGElement): Promise<void> {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    this.downloadFile(svgBlob, `${this.title}-diagram.svg`);
  }

  private async exportPNG(svg: SVGElement): Promise<void> {
    // Check if html2canvas is loaded
    if (typeof html2canvas === 'undefined') {
      console.warn('[MERMAID-VIEWER] html2canvas not loaded, loading now...');
      await this.loadHtml2Canvas();
    }

    // Create canvas from SVG
    const canvas = await html2canvas(svg, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    // Convert to blob
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        this.downloadFile(blob, `${this.title}-diagram.png`);
      }
    }, 'image/png');
  }

  private async exportJSON(): Promise<void> {
    const data = {
      title: this.title,
      mermaidCode: this.mermaidCode,
      exportedAt: new Date().toISOString(),
    };
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    this.downloadFile(jsonBlob, `${this.title}-diagram.json`);
  }

  private loadHtml2Canvas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => {
        console.log('[MERMAID-VIEWER] html2canvas loaded');
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('[MERMAID-VIEWER] Downloaded:', filename);
  }
}
