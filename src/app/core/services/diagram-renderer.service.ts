import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {
  WorkflowDiagramData,
  WorkflowNode,
  WorkflowEdge,
  DependencyGraphData,
  IssueNode,
  DependencyEdge,
  RoadmapData,
  Sprint,
  Milestone,
} from '../models/diagram.interfaces';

@Injectable({
  providedIn: 'root',
})
export class DiagramRendererService {
  private currentZoomTransform: any = null;

  constructor() {}

  // ============================================================================
  // WORKFLOW DIAGRAM RENDERER
  // ============================================================================

  renderWorkflowDiagram(containerId: string, data: WorkflowDiagramData): void {
    console.log('[DIAGRAM RENDERER] Rendering workflow diagram');
    d3.select(`#${containerId}`).select('svg').remove();

    const container = d3.select(`#${containerId}`);
    const {width, height} = data.layout;

    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');
    this.addArrowMarkers(defs);

    const g = svg.append('g').attr('class', 'diagram-content');

    const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
          this.currentZoomTransform = event.transform;
        });

    svg.call(zoomBehavior as any);

    this.renderWorkflowEdges(g, data.nodes, data.edges);
    this.renderWorkflowNodes(g, data.nodes);

    if (data.legend) {
      this.renderLegend(g, data.legend, width, height);
    }
  }

  private renderWorkflowNodes(g: any, nodes: WorkflowNode[]): void {
    const nodeGroups = g
        .selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d: WorkflowNode) => `translate(${d.position.x}, ${d.position.y})`);

    nodeGroups
        .append('rect')
        .attr('x', (d: WorkflowNode) => -d.dimensions.width / 2)
        .attr('y', (d: WorkflowNode) => -d.dimensions.height / 2)
        .attr('width', (d: WorkflowNode) => d.dimensions.width)
        .attr('height', (d: WorkflowNode) => d.dimensions.height)
        .attr('fill', (d: WorkflowNode) => d.color)
        .attr('stroke', (d: WorkflowNode) => d.stroke_color)
        .attr('stroke-width', (d: WorkflowNode) => d.stroke_width)
        .attr('rx', 6);

    nodeGroups
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-10')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text((d: WorkflowNode) => d.name);

    nodeGroups
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '10')
        .style('fill', 'white')
        .style('font-size', '12px')
        .text((d: WorkflowNode) => `${d.issue_count} issues`);
  }

  private renderWorkflowEdges(g: any, nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    g.selectAll('path.edge')
        .data(edges)
        .enter()
        .append('path')
        .attr('class', 'edge')
        .attr('d', (d: WorkflowEdge) => this.calculateEdgePath(d, nodeMap))
        .attr('fill', 'none')
        .attr('stroke', (d: WorkflowEdge) => d.color)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');
  }

  private calculateEdgePath(edge: WorkflowEdge, nodeMap: Map<string, WorkflowNode>): string {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return '';

    const sx = source.position.x;
    const sy = source.position.y;
    const tx = target.position.x;
    const ty = target.position.y;

    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;

    return `M ${sx},${sy} Q ${midX},${midY} ${tx},${ty}`;
  }

  // ============================================================================
  // DEPENDENCY GRAPH RENDERER
  // ============================================================================

  renderDependencyGraph(containerId: string, data: DependencyGraphData): void {
    console.log('[DIAGRAM RENDERER] Rendering dependency graph');
    d3.select(`#${containerId}`).select('svg').remove();

    const container = d3.select(`#${containerId}`);
    const {width, height} = data.layout;

    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');
    this.addArrowMarkers(defs);

    const g = svg.append('g');

    const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoomBehavior as any);

    const simulation = d3
        .forceSimulation<IssueNode>(data.nodes)
        .force('link', d3.forceLink<IssueNode, DependencyEdge>(data.edges).id((d) => d.id).distance(200))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(100));

    const link = g
        .selectAll('line')
        .data(data.edges)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-width', 2);

    const node = g
        .selectAll('g.node')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(this.createDragBehavior(simulation) as any);

    node
        .append('rect')
        .attr('x', -100)
        .attr('y', -40)
        .attr('width', 200)
        .attr('height', 80)
        .attr('fill', (d: IssueNode) => d.status_color)
        .attr('rx', 4);

    node
        .append('text')
        .attr('x', -90)
        .attr('y', -20)
        .style('fill', 'white')
        .style('font-size', '12px')
        .text((d: IssueNode) => d.key);

    node
        .append('text')
        .attr('x', -90)
        .attr('y', 0)
        .style('fill', 'white')
        .style('font-size', '11px')
        .text((d: IssueNode) => this.truncate(d.summary, 30));

    simulation.on('tick', () => {
      link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: IssueNode) => `translate(${d.x},${d.y})`);
    });
  }

  // ============================================================================
  // ROADMAP TIMELINE RENDERER
  // ============================================================================

  renderRoadmapTimeline(containerId: string, data: RoadmapData): void {
    console.log('[DIAGRAM RENDERER] Rendering roadmap timeline');
    d3.select(`#${containerId}`).select('svg').remove();

    const container = d3.select(`#${containerId}`);
    const {width, height} = data.layout;
    const margin = {top: 50, right: 50, bottom: 50, left: 150};

    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g');

    const parseDate = d3.timeParse('%Y-%m-%d');
    const dates = data.sprints.flatMap((s) => [parseDate(s.start_date)!, parseDate(s.end_date)!]);
    const xScale = d3
        .scaleTime()
        .domain([d3.min(dates)!, d3.max(dates)!])
        .range([margin.left, width - margin.right]);

    const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1));
    g.append('g')
        .attr('transform', `translate(0, ${margin.top})`)
        .call(xAxis as any);

    const barHeight = 40;
    const spacing = 20;

    const sprintGroups = g
        .selectAll('g.sprint')
        .data(data.sprints)
        .enter()
        .append('g')
        .attr('transform', (d: Sprint, i: number) => `translate(0, ${margin.top + 50 + i * (barHeight + spacing)})`);

    sprintGroups
        .append('rect')
        .attr('x', (d: Sprint) => xScale(parseDate(d.start_date)!))
        .attr('width', (d: Sprint) => xScale(parseDate(d.end_date)!) - xScale(parseDate(d.start_date)!))
        .attr('height', barHeight)
        .attr('fill', (d: Sprint) => d.color)
        .attr('rx', 4);

    sprintGroups
        .append('text')
        .attr('x', margin.left - 10)
        .attr('y', barHeight / 2)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .text((d: Sprint) => d.name);
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  exportToSVG(containerId: string, filename: string): void {
    const svg = d3.select(`#${containerId}`).select('svg').node() as SVGSVGElement;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = `<?xml version="1.0"?>\n${serializer.serializeToString(svg)}`;
    const blob = new Blob([svgString], {type: 'image/svg+xml'});
    this.downloadBlob(blob, filename);
  }

  exportToPNG(containerId: string, filename: string, scale = 2): void {
    const svg = d3.select(`#${containerId}`).select('svg').node() as SVGSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svg)], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob && this.downloadBlob(blob, filename));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addArrowMarkers(defs: any): void {
    defs
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 9)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0 L0,6 L9,3 z')
        .attr('fill', '#42526E');
  }

  private renderLegend(g: any, legend: any, width: number, height: number): void {
    const legendGroup = g.append('g').attr('transform', `translate(${width - 200}, 50)`);

    legendGroup
        .append('text')
        .style('font-weight', 'bold')
        .text(legend.title || 'Legend');

    legend.items.forEach((item: any, i: number) => {
      const itemG = legendGroup.append('g').attr('transform', `translate(0, ${20 + i * 25})`);
      itemG.append('rect').attr('width', 20).attr('height', 20).attr('fill', item.color);
      itemG.append('text').attr('x', 25).attr('y', 15).text(item.label);
    });
  }

  private createDragBehavior(simulation: any) {
    return d3
        .drag()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  resetZoom(containerId: string): void {
    const svg = d3.select(`#${containerId}`).select('svg');
    svg.transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity);
  }
}
