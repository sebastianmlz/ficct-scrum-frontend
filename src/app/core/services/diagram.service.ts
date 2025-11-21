import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {
  DiagramRequestRequest,
  DiagramResponse,
  DiagramType,
  DiagramFormat,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
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
    console.log('[DIAGRAM SERVICE] 📤 Generating diagram:', {
      type: request.diagram_type,
      project: request.project,
      format: request.format,
      parameters: request.parameters,
      parametersCount: request.parameters ?
      Object.keys(request.parameters).length : 0,
    });
    console.log('[DIAGRAM SERVICE] 🔍 Full request object:',
        JSON.stringify(request, null, 2));
    return this.http.post<DiagramResponse>(`${
      this.baseUrl}/generate/`, request);
  }

  /**
   * Export diagram - dedicated endpoint for exports
   * Uses /export/ endpoint instead of /generate/
   */
  exportDiagram(request: DiagramRequestRequest): Observable<DiagramResponse> {
    console.log('[DIAGRAM SERVICE] 📦 Exporting diagram:', {
      type: request.diagram_type,
      project: request.project,
      format: request.format,
    });
    return this.http
        .post<any>(`${this.baseUrl}/export/`, request, {
          responseType: 'text' as 'json',
        })
        .pipe(
            map((res) => {
              if (typeof res === 'string') {
                return {
                  format: request.format,
                  data: res,
                } as DiagramResponse;
              }
              return res as DiagramResponse;
            }),
        );
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
   * @param projectId - Project UUID
   * @param format - Diagram format (svg or json)
   * @param forceRefresh - Force backend to regenerate (ignore cache)
   */
  generateWorkflowDiagram(
      projectId: string,
      format: DiagramFormat = 'json',
      forceRefresh = false,
  ): Observable<DiagramResponse> {
    const options = forceRefresh ? {force_refresh: true} : undefined;
    return this.generateDiagram({
      diagram_type: 'workflow',
      project: projectId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'dependency',
      project: projectId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'roadmap',
      project: projectId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'uml',
      project: projectId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'architecture',
      project: projectId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'burndown',
      sprint: sprintId,
      format,
      options,
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
      options?: any,
  ): Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: 'velocity',
      project: projectId,
      format,
      options,
    });
  }

  // ===========================
  // EXPORT UTILITIES
  // ===========================

  /**
   * Export diagram as PNG
   */
  exportAsPNG(diagramType: DiagramType, projectId: string, options?: any)
  : Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'png',
      options,
    });
  }

  /**
   * Export diagram as PDF
   */
  exportAsPDF(diagramType: DiagramType, projectId: string, options?: any)
  : Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'pdf',
      options,
    });
  }

  /**
   * Export diagram as SVG
   */
  exportAsSVG(diagramType: DiagramType, projectId: string, options?: any)
  : Observable<DiagramResponse> {
    return this.generateDiagram({
      diagram_type: diagramType,
      project: projectId,
      format: 'svg',
      options,
    });
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  /**
   * Generate filename with timestamp for diagram export
   */
  generateFilename(diagramType: DiagramType, format: DiagramFormat,
      projectName?: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const sanitizedProjectName = projectName ?
      this.sanitizeFilename(projectName) + '-' :
      '';
    return `${sanitizedProjectName}${
      diagramType}-diagram-${timestamp}.${format}`;
  }

  /**
   * Sanitize filename by removing special characters
   */
  private sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 50); // Limit length
  }

  /**
   * Download diagram data as file
   */
  downloadDiagram(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], {type: mimeType});
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
   * Handles both data URLs and raw base64 strings
   */
  downloadBase64Image(base64Data: string, filename: string): void {
    // Ensure data URL format
    let dataUrl = base64Data;
    if (!base64Data.startsWith('data:')) {
      // If backend returns raw base64, add data URL prefix
      const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      dataUrl = `data:${mimeType};base64,${base64Data}`;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export diagram with automatic filename generation and format handling
   */
  exportDiagramWithFormat(
      diagramType: DiagramType,
      projectId: string,
      format: DiagramFormat,
      projectName?: string,
  ): Observable<{success: boolean; filename: string; error?: string}> {
    return new Observable((observer) => {
      const filename = this.generateFilename(diagramType, format, projectName);

      // CRITICAL FIX: Use exportDiagram instead of generateDiagram
      // Export endpoint returns optimized full-quality exports
      this.exportDiagram({
        diagram_type: diagramType,
        project: projectId,
        format,
      }).subscribe({
        next: (response) => {
          try {
            const mimeType = this.getMimeType(format);

            if (format === 'png') {
              // PNG format returned as base64
              if (typeof response.data === 'string') {
                this.downloadBase64Image(response.data, filename);
              } else {
                throw new Error('Invalid data format for PNG export');
              }
            } else {
              // Text formats (SVG, JSON)
              const dataString = typeof response.data === 'string' ?
                response.data :
                JSON.stringify(response.data, null, 2);
              this.downloadDiagram(dataString, filename, mimeType);
            }

            observer.next({success: true, filename});
            observer.complete();
          } catch (error) {
            observer.next({
              success: false,
              filename,
              error: error instanceof Error ? error.message : 'Export failed',
            });
            observer.complete();
          }
        },
        error: (error) => {
          observer.next({
            success: false,
            filename,
            error: error.error?.message || error.message ||
              'Failed to generate diagram',
          });
          observer.complete();
        },
      });
    });
  }

  /**
   * Get MIME type for diagram format
   */
  getMimeType(format: DiagramFormat): string {
    const mimeTypes: Record<DiagramFormat, string> = {
      svg: 'image/svg+xml',
      png: 'image/png',
      pdf: 'application/pdf',
      json: 'application/json',
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
