/**
 * Diagram Data Validation Utilities
 *
 * Provides comprehensive validation for all diagram data types
 * to prevent runtime errors from malformed or missing data.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate workflow diagram data structure
 */
export function validateWorkflowData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Workflow data is null or undefined');
    return {valid: false, errors, warnings};
  }

  // Check nodes array
  if (!data.nodes || !Array.isArray(data.nodes)) {
    errors.push('Missing or invalid nodes array');
  } else if (data.nodes.length === 0) {
    warnings.push('Nodes array is empty');
  } else {
    // Validate each node
    data.nodes.forEach((node: any, index: number) => {
      if (!node) {
        errors.push(`Node at index ${index} is null`);
      } else {
        if (!node.id) errors.push(`Node at index ${index} missing id`);
        if (!node.label && !node.name) {
          warnings.push(`Node ${node.id || index} missing label/name`);
        }
      }
    });
  }

  // Check edges array
  if (!data.edges || !Array.isArray(data.edges)) {
    errors.push('Missing or invalid edges array');
  } else {
    // Validate each edge
    data.edges.forEach((edge: any, index: number) => {
      if (!edge) {
        errors.push(`Edge at index ${index} is null`);
      } else {
        if (!edge.from && !edge.source) {
          errors.push(`Edge at index ${index} missing from/source`);
        }
        if (!edge.to && !edge.target) {
          errors.push(`Edge at index ${index} missing to/target`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate dependency graph data structure
 */
export function validateDependencyData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Dependency data is null or undefined');
    return {valid: false, errors, warnings};
  }

  // Check nodes array
  if (!data.nodes || !Array.isArray(data.nodes)) {
    errors.push('Missing or invalid nodes array');
  } else if (data.nodes.length === 0) {
    warnings.push('No dependency nodes available');
  } else {
    // Validate each node
    data.nodes.forEach((node: any, index: number) => {
      if (!node) {
        errors.push(`Node at index ${index} is null`);
      } else {
        if (!node.id) errors.push(`Node at index ${index} missing id`);
        if (!node.issue_key && !node.key) {
          warnings.push(`Node ${node.id || index} missing issue key`);
        }
      }
    });
  }

  // Check links/edges array
  const linksArray = data.links || data.edges;
  if (!linksArray || !Array.isArray(linksArray)) {
    warnings.push(
        'Missing or invalid links/edges array (may have no dependencies)',
    );
  } else {
    // Validate each link
    linksArray.forEach((link: any, index: number) => {
      if (!link) {
        warnings.push(`Link at index ${index} is null`);
      } else {
        if (!link.source && !link.from) {
          warnings.push(`Link at index ${index} missing source`);
        }
        if (!link.target && !link.to) {
          warnings.push(`Link at index ${index} missing target`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate roadmap diagram data structure
 */
export function validateRoadmapData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Roadmap data is null or undefined');
    return {valid: false, errors, warnings};
  }

  // Check sprints array
  if (!data.sprints || !Array.isArray(data.sprints)) {
    errors.push('Missing or invalid sprints array');
  } else if (data.sprints.length === 0) {
    warnings.push('No sprints available for roadmap');
  } else {
    // Validate each sprint
    data.sprints.forEach((sprint: any, index: number) => {
      if (!sprint) {
        warnings.push(`Sprint at index ${index} is null`);
        return;
      }

      if (!sprint.id) {
        errors.push(`Sprint at index ${index} missing id`);
      }

      if (!sprint.name) {
        warnings.push(`Sprint ${sprint.id || index} missing name`);
      }

      // Validate dates
      if (!sprint.start_date) {
        errors.push(`Sprint ${sprint.id || index} missing start_date`);
      } else {
        const startDate = new Date(sprint.start_date);
        if (isNaN(startDate.getTime())) {
          errors.push(
              `Sprint ${sprint.id || index} has invalid start_date: ${
                sprint.start_date
              }`,
          );
        }
      }

      if (!sprint.end_date) {
        errors.push(`Sprint ${sprint.id || index} missing end_date`);
      } else {
        const endDate = new Date(sprint.end_date);
        if (isNaN(endDate.getTime())) {
          errors.push(
              `Sprint ${sprint.id || index} has invalid end_date: ${
                sprint.end_date
              }`,
          );
        }
      }

      // Validate date order
      if (sprint.start_date && sprint.end_date) {
        const start = new Date(sprint.start_date);
        const end = new Date(sprint.end_date);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (end < start) {
            errors.push(
                `Sprint ${sprint.id || index} has end_date before start_date`,
            );
          }
        }
      }
    });
  }

  // Check timeline if present
  if (data.timeline) {
    if (!data.timeline.start_date) {
      warnings.push('Timeline missing start_date');
    }
    if (!data.timeline.end_date) {
      warnings.push('Timeline missing end_date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation result to console
 */
export function logValidationResult(
    componentName: string,
    result: ValidationResult,
): void {
  if (result.valid) {
    console.log(`[${componentName}] ✅ Validation passed`);
  } else {
    console.error(`[${componentName}] ❌ Validation failed:`, result.errors);
  }

  if (result.warnings.length > 0) {
    console.warn(`[${componentName}] ⚠️ Validation warnings:`, result.warnings);
  }
}

/**
 * Validate parsed diagram data based on type
 */
export function validateDiagramData(type: string, data: any): ValidationResult {
  switch (type.toLowerCase()) {
    case 'workflow':
      return validateWorkflowData(data);
    case 'dependency':
      return validateDependencyData(data);
    case 'roadmap':
      return validateRoadmapData(data);
    default:
      return {
        valid: false,
        errors: [`Unknown diagram type: ${type}`],
        warnings: [],
      };
  }
}
