import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {
  DiagramRequestRequest,
  DiagramResponse,
  UMLDiagramData,
  ArchitectureDiagramData,
  GitHubIntegration,
} from '../models/interfaces';

export interface DiagramErrorResponse {
  status: 'error';
  error: string;
  code: 'CONFIGURATION_ERROR' | 'INVALID_OPTIONS' | 'QUERY_ERROR' |
  'GITHUB_API_ERROR' | 'INTERNAL_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR';
  valid_options?: string[]; // For INVALID_OPTIONS errors
}

export interface ParsedDiagramResponse {
  diagram_type: 'uml' | 'architecture';
  format: string;
  cached: boolean;
  data: UMLDiagramData | ArchitectureDiagramData;
}

@Injectable({
  providedIn: 'root',
})
export class GitHubDiagramService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1`;

  /**
   * Check if project has active GitHub integration
   * Returns null if no integration exists
   */
  checkGitHubIntegration(projectId: string)
  : Observable<GitHubIntegration | null> {
    console.log('[DIAGRAM SERVICE] Checking GitHub integration for project:',
        projectId);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.get<{ count: number; results: GitHubIntegration[] }>(
        `${this.baseUrl}/integrations/github/`,
        {headers, params: {project: projectId}},
    ).pipe(
        map((response) => {
          console.log('[DIAGRAM SERVICE] Integration check response:',
              response);
          if (response.results && response.results.length > 0) {
            const integration = response.results[0];
            console.log('[DIAGRAM SERVICE] ✅ GitHub integration found:',
                integration.id);
            return integration;
          }
          console.log('[DIAGRAM SERVICE] ⚠️ No GitHub integration found');
          return null;
        }),
        catchError((error) => {
          console.error('[DIAGRAM SERVICE] Error checking integration:', error);
          return throwError(() => error);
        }),
    );
  }

  /**
   * Generate UML Class Diagram
   * Backend analyzes GitHub repository and returns class structure
   * CRITICAL: Only "class" diagram type is supported in v1
   */
  generateUMLDiagram(projectId: string): Observable<ParsedDiagramResponse> {
    console.log('[DIAGRAM SERVICE] Generating UML diagram for project:',
        projectId);

    const request: DiagramRequestRequest = {
      diagram_type: 'uml',
      project: projectId,
      format: 'json',
      options: {
        // CRITICAL: Only "class" is valid in v1,
        // backend will reject "sequence" with 400
        layout: 'hierarchical',
      },
    };

    console.log('[DIAGRAM SERVICE] ✅ Request validated -' +
      ' UML class diagram only (v1 restriction)');

    return this.generateDiagram(request);
  }

  /**
   * Generate Architecture Diagram
   * Backend analyzes GitHub repository and returns layered architecture
   */
  generateArchitectureDiagram(projectId: string)
  : Observable<ParsedDiagramResponse> {
    console.log('[DIAGRAM SERVICE] Generating Architecture' +
      ' diagram for project:', projectId);

    const request: DiagramRequestRequest = {
      diagram_type: 'architecture',
      project: projectId,
      format: 'json',
      options: {
        layout: 'hierarchical',
      },
    };

    return this.generateDiagram(request);
  }

  /**
   * Generic diagram generation with proper error handling
   */
  private generateDiagram(request: DiagramRequestRequest)
  : Observable<ParsedDiagramResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    console.log('[DIAGRAM SERVICE] Request payload:', JSON.stringify(request));
    console.log('[DIAGRAM SERVICE] Endpoint:', `${
      this.baseUrl}/diagrams/generate/`);

    return this.http.post<DiagramResponse>(
        `${this.baseUrl}/diagrams/generate/`,
        request,
        {headers},
    ).pipe(
        map((response) => {
          console.log('[DIAGRAM SERVICE] Raw response received:', response);

          // Parse the stringified data field
          const parsedData = this.parseData(response);

          console.log('[DIAGRAM SERVICE] ✅ Diagram generated successfully');
          console.log('[DIAGRAM SERVICE] Diagram type:', response.diagram_type);
          console.log('[DIAGRAM SERVICE] Cached:', response.cached);

          return {
            diagram_type: response.diagram_type as 'uml' | 'architecture',
            format: response.format,
            cached: response.cached || false,
            data: parsedData,
          };
        }),
        catchError((error) => {
          console.error('[DIAGRAM SERVICE] Error generating diagram:', error);

          // Handle 400 errors with specific codes
          if (error.status === 400) {
            const errorCode = error.error?.code;

            if (errorCode === 'INVALID_OPTIONS') {
              console.error('[DIAGRAM SERVICE] ❌ INVALID_OPTIONS:',
                  error.error.error);
              return throwError(() => ({
                status: 'error',
                error: error.error.error || 'Invalid diagram options provided',
                code: 'INVALID_OPTIONS',
                valid_options: error.error.valid_options,
              } as DiagramErrorResponse));
            }

            // CONFIGURATION_ERROR - No GitHub integration or token missing
            if (errorCode === 'CONFIGURATION_ERROR') {
              console.error('[DIAGRAM SERVICE] ❌ CONFIGURATION_ERROR: ' +
                'GitHub integration issue');
              return throwError(() => ({
                status: 'error',
                error: error.error.error || 'GitHub integration not ' +
                'properly configured',
                code: 'CONFIGURATION_ERROR',
              } as DiagramErrorResponse));
            }

            // QUERY_ERROR - Database error
            if (errorCode === 'QUERY_ERROR') {
              console.error('[DIAGRAM SERVICE] ❌ QUERY_ERROR: Database issue');
              return throwError(() => ({
                status: 'error',
                error: error.error.error || 'Could not retrieve diagram data',
                code: 'QUERY_ERROR',
              } as DiagramErrorResponse));
            }

            // Generic 400 error
            console.error('[DIAGRAM SERVICE] ❌ Bad request (400):',
                error.error);
            return throwError(() => ({
              status: 'error',
              error: error.error?.error || 'Bad request',
              code: 'UNKNOWN_ERROR',
            } as DiagramErrorResponse));
          }

          // Handle 500 errors - INTERNAL_ERROR
          if (error.status === 500) {
            console.error('[DIAGRAM SERVICE] ❌ INTERNAL_ERROR (500):',
                error.error);
            return throwError(() => ({
              status: 'error',
              error: error.error?.error ||
              'An unexpected server error occurred',
              code: 'INTERNAL_ERROR',
            } as DiagramErrorResponse));
          }

          // Timeout or network error
          if (error.status === 0 || error.status === 504) {
            console.error('[DIAGRAM SERVICE] ❌ Timeout or network error');
            return throwError(() => ({
              status: 'error',
              error: 'Request timeout - diagram generation taking too long',
              code: 'TIMEOUT_ERROR',
            } as DiagramErrorResponse));
          }

          // Unknown error
          console.error('[DIAGRAM SERVICE] ❌ Unknown error:', error);
          return throwError(() => ({
            status: 'error',
            error: error.error?.error || 'Unknown error occurred',
            code: 'UNKNOWN_ERROR',
          } as DiagramErrorResponse));
        }),
    );
  }

  /**
   * Parse stringified data field from backend
   * Backend returns data as STRING that needs JSON.parse()
   */
  private parseData(response: DiagramResponse)
  : UMLDiagramData | ArchitectureDiagramData {
    try {
      // CRITICAL: Backend returns data as STRING, not object
      if (typeof response.data === 'string') {
        console.log('[DIAGRAM SERVICE] Parsing stringified data...');
        const parsed = JSON.parse(response.data);
        console.log('[DIAGRAM SERVICE] ✅ Data parsed successfully');
        return parsed;
      } else {
        // Already an object (shouldn't happen but handle gracefully)
        console.log('[DIAGRAM SERVICE] Data already parsed (unexpected)');
        return response.data as any;
      }
    } catch (error) {
      console.error('[DIAGRAM SERVICE] ❌ Failed to parse diagram data:', error);
      throw new Error('Failed to parse diagram data from backend');
    }
  }

  /**
   * Validate diagram data structure
   */
  validateUMLData(data: any): data is UMLDiagramData {
    return data &&
           data.diagram_type === 'class' &&
           Array.isArray(data.classes) &&
           Array.isArray(data.relationships);
  }

  validateArchitectureData(data: any): data is ArchitectureDiagramData {
    return data &&
           Array.isArray(data.layers) &&
           Array.isArray(data.connections);
  }
}
