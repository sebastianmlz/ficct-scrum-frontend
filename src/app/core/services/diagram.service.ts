import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DiagramRequestRequest,
  DiagramResponse,
  DiagramType,
  DiagramFormat,
  WorkflowDiagramData,
  DependencyDiagramData,
  RoadmapDiagramData,
  UMLDiagramData,
  ArchitectureDiagramData
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiagramService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/reporting/diagrams`;

  // ===========================
  // DIAGRAM GENERATION
  // ===========================

  /**
   * Generate diagram based on request
   */
  generateDiagram(request: DiagramRequestRequest): Observable<DiagramResponse> {
    return this.http.post<DiagramResponse>(`${this.baseUrl}/generate/`, request);
  }

  /**
   * List cached diagrams
   */
  getCachedDiagrams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  // ===========================
  // WORKFLOW DIAGRAM
  // ===========================

  /**
   * Generate workflow diagram for a project
   */
  generateWorkflowDiagram(
    projectId: string, 
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'workflow',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // DEPENDENCY DIAGRAM
  // ===========================

  /**
   * Generate dependency diagram for a project
   */
  generateDependencyDiagram(
    projectId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'dependency',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // ROADMAP DIAGRAM
  // ===========================

  /**
   * Generate roadmap timeline for a project
   */
  generateRoadmapDiagram(
    projectId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'roadmap',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // UML DIAGRAM
  // ===========================

  /**
   * Generate UML diagram from code
   */
  generateUMLDiagram(
    projectId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'uml',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // ARCHITECTURE DIAGRAM
  // ===========================

  /**
   * Generate architecture diagram
   */
  generateArchitectureDiagram(
    projectId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'architecture',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // BURNDOWN CHART
  // ===========================

  /**
   * Generate burndown chart for sprint
   */
  generateBurndownChart(
    sprintId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'burndown',
      sprint: sprintId,
      format,
      options
    });
  }

  // ===========================
  // VELOCITY CHART
  // ===========================

  /**
   * Generate velocity chart for project
   */
  generateVelocityChart(
    projectId: string,
    format: DiagramFormat = 'json',
    options?: any
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'velocity',
      project: projectId,
      format,
      options
    });
  }

  // ===========================
  // EXPORT UTILITIES
  // ===========================

  /**
   * Export diagram as PNG
   */
  exportAsPNG(diagramType: DiagramType, projectId: string, options?: any): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'png',
      options
    });
  }

  /**
   * Export diagram as PDF
   */
  exportAsPDF(diagramType: DiagramType, projectId: string, options?: any): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'pdf',
      options
    });
  }

  /**
   * Export diagram as SVG
   */
  exportAsSVG(diagramType: DiagramType, projectId: string, options?: any): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'svg',
      options
    });
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  /**
   * Download diagram data as file
   */
  downloadDiagram(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Convert base64 image to downloadable file
   */
  downloadBase64Image(base64Data: string, filename: string): void {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get MIME type for diagram format
   */
  getMimeType(format: DiagramFormat): string {
    const mimeTypes: Record<DiagramFormat, string> = {
      svg: 'image/svg+xml',
      png: 'image/png',
      pdf: 'application/pdf',
      json: 'application/json'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Get file extension for diagram format
   */
  getFileExtension(format: DiagramFormat): string {
    return `.${format}`;
  }
}
