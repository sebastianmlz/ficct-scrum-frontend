import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WorkflowDiagramData, DiagramResponse, DiagramFormat } from '../../../../core/models/interfaces';
import { DiagramExportDropdownComponent } from '../../../../shared/components/diagram-export-dropdown/diagram-export-dropdown.component';
import { DiagramErrorStateComponent } from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import { DiagramErrorState, analyzeDiagramError, logDiagramError } from '../../../../shared/utils/diagram-error.utils';
import * as d3 from 'd3';

@Component({
  selector: 'app-workflow-diagram',
  standalone: true,
  imports: [CommonModule, DiagramExportDropdownComponent, DiagramErrorStateComponent],
  templateUrl: './workflow-diagram.component.html',
  styleUrls: ['./workflow-diagram.component.scss']
})
export class WorkflowDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') svgContainer!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  projectId = signal<string>('');
  diagramData = signal<WorkflowDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  loading = signal(false);
  exporting = signal(false);
  errorState = signal<DiagramErrorState | null>(null);
  
  private svg: any;
  private simulation: any;

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDiagram();
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
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(response.data));
            this.diagramData.set(null); // Clear D3 data
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data for D3 rendering
          if (typeof response.data === 'string') {
            this.diagramData.set(JSON.parse(response.data));
          } else {
            this.diagramData.set(response.data as WorkflowDiagramData);
          }
          this.safeSvgContent.set(null); // Clear SVG content
          setTimeout(() => this.renderDiagram(), 100);
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
    if (!data || !this.svgContainer) return;

    const width = this.svgContainer.nativeElement.clientWidth;
    const height = 600;

    // Clear previous diagram
    d3.select(this.svgContainer.nativeElement).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(this.svgContainer.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add arrow marker
    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');

    // Create force simulation
    this.simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.edges as any)
        .id((d: any) => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw links
    const link = this.svg.append('g')
      .selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = this.svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(d3.drag<any, any>()
        .on('start', (event: any, d: any) => this.dragstarted(event, d))
        .on('drag', (event: any, d: any) => this.dragged(event, d))
        .on('end', (event: any, d: any) => this.dragended(event, d)));

    // Add circles to nodes
    node.append('circle')
      .attr('r', 30)
      .attr('fill', (d: any) => this.getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    // Add issue count badges
    node.filter((d: any) => d.issue_count && d.issue_count > 0)
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('r', 12)
      .attr('fill', '#EF4444');

    node.filter((d: any) => d.issue_count && d.issue_count > 0)
      .append('text')
      .attr('x', 20)
      .attr('y', -16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .text((d: any) => d.issue_count);

    // Update positions on tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: any) => {
        this.svg.selectAll('g').attr('transform', event.transform);
      });

    this.svg.call(zoom as any);
  }

  getNodeColor(type: string): string {
    switch (type) {
      case 'start':
        return '#10B981'; // green
      case 'intermediate':
        return '#3B82F6'; // blue
      case 'end':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  }

  dragstarted(event: any, d: any): void {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragended(event: any, d: any): void {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  onExportFormat(format: DiagramFormat): void {
    this.exporting.set(true);
    
    this.diagramService.exportDiagramWithFormat(
      'workflow',
      this.projectId(),
      format
    ).subscribe({
      next: (result) => {
        this.exporting.set(false);
        if (result.success) {
          this.notificationService.success(
            'Export Successful',
            `Workflow diagram exported as ${format.toUpperCase()}: ${result.filename}`
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

  refreshDiagram(): void {
    this.loadDiagram();
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
  }
}
