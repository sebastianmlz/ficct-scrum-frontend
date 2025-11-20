/**
 * Diagram Error Handling Utilities
 * Provides consistent error handling and user-friendly messages for
   all diagram components
 */

export type DiagramErrorType =
  | 'MISSING_GITHUB_INTEGRATION'
  | 'NO_DATA'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface DiagramErrorState {
  type: DiagramErrorType;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  icon: 'github' | 'chart-empty' | 'wifi-off' | 'error';
  canRetry: boolean;
}

/**
 * Analyze error and return user-friendly error state
 */
export function analyzeDiagramError(error: any, projectId?: string):
DiagramErrorState {
  // GitHub Integration Missing
  if (error.status === 500 &&
      error.error?.error &&
      typeof error.error.error === 'string' &&
      error.error.error.toLowerCase().includes('github')) {
    return {
      type: 'MISSING_GITHUB_INTEGRATION',
      title: 'GitHub Integration Required',
      message: 'Connect your GitHub repository to view code metrics, ' +
      'dependencies, and architecture diagrams.',
      actionLabel: 'Connect GitHub',
      actionRoute: projectId ? `/projects/${projectId}/config` : '/projects',
      icon: 'github',
      canRetry: false,
    };
  }

  // No Data Available
  if (error.status === 500 &&
      error.error?.error &&
      typeof error.error.error === 'string' &&
      (error.error.error.toLowerCase().includes('no data') ||
       error.error.error.toLowerCase().includes('not found'))) {
    return {
      type: 'NO_DATA',
      title: 'No Data Available',
      message: 'Start working on issues and sprints to generate insights ' +
      'and visualizations.',
      icon: 'chart-empty',
      canRetry: false,
    };
  }

  // Network Error
  if (error.status === 0 ||
    error.name === 'HttpErrorResponse' && !error.status) {
    return {
      type: 'NETWORK_ERROR',
      title: 'Connection Error',
      message: 'Unable to reach the server. Please check your internet ' +
      'connection and try again.',
      actionLabel: 'Retry',
      icon: 'wifi-off',
      canRetry: true,
    };
  }

  // Unknown/Generic Error
  return {
    type: 'UNKNOWN_ERROR',
    title: 'Failed to Generate Diagram',
    message: 'An unexpected error occurred. Please try again later.',
    actionLabel: 'Retry',
    icon: 'error',
    canRetry: true,
  };
}

/**
 * Check if response contains SVG data
 */
export function isSvgResponse(response: any): boolean {
  return response.format === 'svg' && typeof response.data === 'string';
}

/**
 * Check if response contains JSON data
 */
export function isJsonResponse(response: any): boolean {
  return response.format === 'json';
}

/**
 * Log diagram error for debugging
 */
export function logDiagramError(componentName: string, error: any): void {
  console.error(`[${componentName}] Diagram generation failed:`, {
    status: error.status,
    statusText: error.statusText,
    message: error.message,
    errorBody: error.error,
  });
}
