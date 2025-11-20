import {Component, OnInit, Input, signal, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DiagramService} from '../../../../core/services/diagram.service';
import {MermaidGeneratorService}
  from '../../../../core/services/mermaid-generator.service';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {DiagramErrorStateComponent}
  from '@shared/components/diagram-error-state/diagram-error-state.component';
import {MermaidViewerComponent}
  from '../../../../shared/components/mermaid-viewer/mermaid-viewer.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError}
  from '../../../../shared/utils/diagram-error.utils';

// Import Mermaid dynamically

import {ElementRef, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {effect, AfterViewInit} from '@angular/core';
declare const mermaid: any;

@Component({
  selector: 'app-uml-diagram-mermaid',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent],
  templateUrl: './uml-diagram-mermaid.component.html',
  styleUrls: ['./uml-diagram-mermaid.component.scss'],
})
export class UMLDiagramMermaidComponent implements OnInit, AfterViewInit {
  @Input() projectId!: string;
  @ViewChild(MermaidViewerComponent) mermaidViewer?: MermaidViewerComponent;

  @ViewChild('mermaidContainer') mermaidContainer?: ElementRef<HTMLDivElement>;

  // Data
  umlData: any | null = null;
  mermaidCode = signal<string>('');

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);
  errorState = signal<DiagramErrorState | null>(null);
  cacheStatus = signal<'HIT' | 'MISS' | null>(null);

  // Selection for detail panel
  selectedClass = signal<any | null>(null);
  showDetailPanel = signal(false);

  // GitHub Integration
  gitHubIntegration: any | null = null;
  isLoadingIntegration = signal(false);

  // Mermaid initialized flag
  private mermaidInitialized = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private mermaidGenerator = inject(MermaidGeneratorService);
  private githubService = inject(GitHubIntegrationService);
  private sanitizer = inject(DomSanitizer);
  constructor() {
    // Get projectId from route if not provided as Input
    if (!this.projectId) {
      this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';
    }

    // Effect to re-render Mermaid when code changes
    effect(() => {
      if (this.mermaidCode() && this.mermaidInitialized) {
        setTimeout(() => this.renderMermaid(), 100);
      }
    });
  }

  ngOnInit(): void {
    console.log('[UML-MERMAID] Component initialized for project:',
        this.projectId);
    this.loadMermaidLibrary();
    this.loadDiagram();
    this.loadGitHubIntegration();
  }

  ngAfterViewInit(): void {
    if (this.mermaidInitialized) {
      this.renderMermaid();
    }
  }

  /**
   * Load Mermaid library dynamically
   */
  loadMermaidLibrary(): void {
    // Check if Mermaid is already loaded
    if (typeof mermaid !== 'undefined') {
      this.initializeMermaid();
      return;
    }

    // Load Mermaid from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = () => {
      console.log('[UML-MERMAID] Mermaid library loaded from CDN');
      this.initializeMermaid();
    };
    script.onerror = () => {
      console.error('[UML-MERMAID] Failed to load Mermaid library');
      this.error.set('Failed to load diagram library');
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
      });
      this.mermaidInitialized = true;
      console.log('[UML-MERMAID] Mermaid initialized successfully');
    }
  }

  /**
   * Load UML diagram data from backend
   */
  loadDiagram(): void {
    this.isLoading.set(true);
    this.errorState.set(null);
    this.error.set(null);

    console.log('[UML-MERMAID] Loading diagram for project:', this.projectId);

    this.diagramService.generateUMLDiagram(this.projectId, 'json').subscribe({
      next: (response) => {
        console.log('[UML-MERMAID] Response received');

        // Parse cache status
        if (response.cached !== undefined) {
          this.cacheStatus.set(response.cached ? 'HIT' : 'MISS');
        }

        // Parse UML data
        this.parseUMLData(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        logDiagramError('UML-MERMAID', err);
        this.errorState.set(analyzeDiagramError(err, this.projectId));
        this.error.set('Failed to load UML diagram');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Parse UML data and generate Mermaid code
   */
  parseUMLData(response: any): void {
    try {
      // Parse JSON data (backend returns STRING)
      let data: any;
      if (typeof response.data === 'string') {
        data = JSON.parse(response.data);
      } else {
        data = response.data;
      }

      this.umlData = data;

      console.log('[UML-MERMAID] Parsed data:', {
        classes: data.classes?.length || 0,
        relationships: data.relationships?.length || 0,
      });

      // Generate Mermaid syntax
      const mermaidSyntax = this.mermaidGenerator.generateClassDiagram(
          data.classes || [],
          data.relationships || [],
      );

      console.log('[UML-MERMAID] Generated Mermaid syntax (first 200 chars):',
          mermaidSyntax.substring(0, 200));

      this.mermaidCode.set(mermaidSyntax);
    } catch (e: any) {
      console.error('[UML-MERMAID] Parse error:', e);
      this.error.set('Failed to parse UML data');
    }
  }

  /**
   * Render Mermaid diagram
   */
  async renderMermaid(): Promise<void> {
    if (!this.mermaidInitialized || !this.mermaidCode() ||
        !this.mermaidContainer) {
      return;
    }

    try {
      const container = this.mermaidContainer.nativeElement;
      container.innerHTML = `<div class="mermaid">${this.mermaidCode()}</div>`;

      // Render with Mermaid
      await mermaid.run({
        nodes: container.querySelectorAll('.mermaid'),
      });

      console.log('[UML-MERMAID] Diagram rendered successfully');

      // Setup click handlers after rendering
      setTimeout(() => this.setupClickHandlers(), 300);
    } catch (e: any) {
      console.error('[UML-MERMAID] Render error:', e);
      this.error.set('Failed to render diagram');
    }
  }

  /**
   * Setup click handlers for class boxes in SVG
   */
  setupClickHandlers(): void {
    if (!this.mermaidContainer) return;

    const svgElements =
      this.mermaidContainer.nativeElement.querySelectorAll('.node');

    svgElements.forEach((node: Element) => {
      (node as HTMLElement).style.cursor = 'pointer';

      node.addEventListener('click', (e) => {
        e.stopPropagation();

        const textElement = node.querySelector('text, .nodeLabel');
        if (textElement) {
          const className = textElement.textContent?.trim() || '';
          this.onClassClicked(className);
        }
      });
    });

    console.log('[UML-MERMAID] Click handlers setup for',
        svgElements.length, 'nodes');
  }

  /**
   * Handle click on class in diagram
   */
  onClassClicked(className: string): void {
    console.log('[UML-MERMAID] Class clicked:', className);

    const cls = this.umlData?.classes?.find((c: any) =>
      c.name === className ||
      c.name.replace(/[^a-zA-Z0-9_]/g, '_') === className,
    );

    if (cls) {
      this.selectedClass.set(cls);
      this.showDetailPanel.set(true);
      console.log('[UML-MERMAID] Detail panel opened for:', cls.name);
    } else {
      console.warn('[UML-MERMAID] Class not found:', className);
    }
  }

  /**
   * Close detail panel
   */
  closeDetailPanel(): void {
    this.showDetailPanel.set(false);
    this.selectedClass.set(null);
  }

  /**
   * Load GitHub integration
   */
  loadGitHubIntegration(): void {
    if (!this.projectId) return;

    this.isLoadingIntegration.set(true);

    this.githubService.getIntegration(this.projectId).subscribe({
      next: (integration: any) => {
        this.gitHubIntegration = integration || null;
        this.isLoadingIntegration.set(false);
        console.log('[UML-MERMAID] GitHub integration:',
            !!this.gitHubIntegration);
      },
      error: () => {
        this.isLoadingIntegration.set(false);
        console.warn('[UML-MERMAID] No GitHub integration found');
      },
    });
  }

  /**
   * Navigate to GitHub repository file
   */
  goToRepo(cls: any): void {
    if (!this.gitHubIntegration) {
      alert('GitHub repository not connected');
      return;
    }

    const {repositoryOwner, repositoryName} = this.gitHubIntegration;
    const url =`https://github.com/${repositoryOwner}/${repositoryName}` +
    `/blob/main/${cls.file_path}`;
    window.open(url, '_blank');

    console.log('[UML-MERMAID] Navigating to GitHub:', url);
  }

  /**
   * Retry loading diagram
   */
  retryLoadDiagram(): void {
    this.loadDiagram();
  }

  /**
   * Export diagram (placeholder)
   */
  exportDiagram(): void {
    console.log('[UML-MERMAID] Export functionality - TBD');
    alert('Export feature coming soon!');
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    this.router.navigate(['../../'], {relativeTo: this.route});
  }
}
