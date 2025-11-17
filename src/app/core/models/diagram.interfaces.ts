/**
 * TypeScript interfaces for D3.js diagram data structures
 * Supports workflow diagrams, dependency graphs, and roadmap timelines
 */

// ============================================================================
// WORKFLOW DIAGRAM INTERFACES
// ============================================================================

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  color: string;
  stroke_color: string;
  stroke_width: number;
  issue_count: number;
  is_start: boolean;
  is_end: boolean;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  color: string;
  width: number;
}

export interface WorkflowLegend {
  title: string;
  items: Array<{
    label: string;
    color: string;
    description?: string;
  }>;
}

export interface WorkflowDiagramData {
  metadata: {
    project_name: string;
    status_count: number;
    transition_count: number;
    generated_at?: string;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  legend: WorkflowLegend;
  layout: {
    width: number;
    height: number;
    direction?: 'horizontal' | 'vertical';
  };
}

// ============================================================================
// DEPENDENCY GRAPH INTERFACES
// ============================================================================

export interface IssueNodeAssignee {
  user_uuid: string;
  full_name: string;
  avatar_url?: string;
  initials: string;
}

export interface IssueNode {
  id: string;
  key: string;
  summary: string;
  status: string;
  status_color: string;
  priority: string;
  priority_color: string;
  assignee?: IssueNodeAssignee;
  issue_type: string;
  issue_type_icon?: string;
  x?: number; // For force simulation
  y?: number;
  fx?: number | null; // Fixed position
  fy?: number | null;
}

export interface DependencyEdge {
  id: string;
  source: string | IssueNode;
  target: string | IssueNode;
  type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates';
  label: string;
  color?: string;
}

export interface DependencyGraphMetadata {
  project_name: string;
  issue_count: number;
  dependency_count: number;
  has_cycles: boolean;
  cycle_count?: number;
  generated_at?: string;
}

export interface DependencyGraphData {
  metadata: DependencyGraphMetadata;
  nodes: IssueNode[];
  edges: DependencyEdge[];
  clusters?: Array<{
    id: string;
    name: string;
    issue_ids: string[];
    color: string;
  }>;
  layout: {
    type: 'force-directed' | 'hierarchical' | 'circular';
    width: number;
    height: number;
  };
}

// ============================================================================
// ROADMAP TIMELINE INTERFACES
// ============================================================================

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed';
  color: string;
  progress: number;
  issue_count: number;
  completed_issues: number;
  story_points?: number;
  completed_story_points?: number;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  description?: string;
  color: string;
  icon?: string;
  is_completed: boolean;
}

export interface RoadmapMetadata {
  project_name: string;
  sprint_count: number;
  milestone_count: number;
  date_range: {
    start: string;
    end: string;
  };
  generated_at?: string;
}

export interface RoadmapData {
  metadata: RoadmapMetadata;
  sprints: Sprint[];
  milestones: Milestone[];
  today?: string;
  layout: {
    width: number;
    height: number;
    bar_height?: number;
    spacing?: number;
  };
}

// ============================================================================
// ARCHITECTURE DIAGRAM INTERFACES (for completeness)
// ============================================================================

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'external';
  technology?: string;
  color: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  icon?: string;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'api_call' | 'data_flow' | 'dependency' | 'authentication';
  color: string;
  bidirectional?: boolean;
}

export interface ArchitectureDiagramData {
  metadata: {
    project_name: string;
    component_count: number;
    connection_count: number;
    generated_at?: string;
  };
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  layers?: Array<{
    name: string;
    node_ids: string[];
    y_position: number;
  }>;
  layout: {
    width: number;
    height: number;
  };
}

// ============================================================================
// UNIFIED DIAGRAM RESPONSE INTERFACE
// ============================================================================

export interface DiagramResponse {
  diagram_type: 'workflow' | 'dependency' | 'roadmap' | 'architecture' | 'uml';
  data: WorkflowDiagramData | DependencyGraphData | RoadmapData | ArchitectureDiagramData | any;
  format: 'json' | 'svg';
  cached: boolean;
  generated_at?: string;
}

// ============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

export function isWorkflowData(obj: any): obj is WorkflowDiagramData {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.nodes) &&
    Array.isArray(obj.edges) &&
    obj.metadata &&
    obj.layout
  );
}

export function isDependencyGraphData(obj: any): obj is DependencyGraphData {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.nodes) &&
    Array.isArray(obj.edges) &&
    obj.metadata &&
    obj.layout &&
    obj.layout.type
  );
}

export function isRoadmapData(obj: any): obj is RoadmapData {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.sprints) &&
    obj.metadata &&
    obj.layout
  );
}

export function isArchitectureData(obj: any): obj is ArchitectureDiagramData {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.nodes) &&
    Array.isArray(obj.edges) &&
    obj.metadata &&
    obj.layout
  );
}

// ============================================================================
// EXPORT OPTIONS INTERFACE
// ============================================================================

export interface DiagramExportOptions {
  format: 'svg' | 'png' | 'pdf';
  filename: string;
  scale?: number; // For PNG export (default: 2)
  quality?: number; // For PNG export (default: 0.95)
  backgroundColor?: string; // Optional background color
}

// ============================================================================
// DIAGRAM CONTROLS STATE
// ============================================================================

export interface DiagramControlsState {
  zoom: number;
  pan: { x: number; y: number };
  fitToScreen: boolean;
  showLegend: boolean;
  showLabels: boolean;
}
