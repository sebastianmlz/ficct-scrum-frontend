// TypeScript interfaces for FICCT-SCRUM API

import {
  OrganizationTypeEnum,
  SubscriptionPlanEnum,
  OrganizationMemberRoleEnum,
  OrganizationMemberStatusEnum,
  WorkspaceMemberRoleEnum,
  WorkspaceTypeEnum,
  VisibilityEnum,
  MethodologyEnum,
  Status0acEnum,
  PriorityEnum,
  SprintDurationEnum,
  EstimationTypeEnum,
  TimezoneEnum,
  LanguageEnum,
  ActionTypeEnum,
  LevelEnum,
  SeverityEnum,
  ErrorLogStatusEnum,
  ProjectStatusEnum,
  IssueLinkTypeEnum,
} from './enums';

// Base/Common Interfaces
export interface User {
  id: number;
  user_uuid?: string; // UUID representation for assignee fields
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
  last_login?: string;
  is_active: boolean;
  avatar_url?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  profile?: UserProfileNested;
}

export interface UserBasic {
  id: number;
  user_uuid?: string; // UUID representation for assignee fields
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
}

export interface UserProfileNested {
  avatar_url: string;
  bio?: string;
  phone_number?: string;
  timezone?: TimezoneEnum;
  language?: LanguageEnum;
  github_username?: string;
  linkedin_url?: string;
  website_url?: string;
  notification_preferences?: object;
  is_online: boolean;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user: UserBasic;
  avatar_url: string;
  bio?: string;
  phone_number?: string;
  timezone?: TimezoneEnum;
  language?: LanguageEnum;
  github_username?: string;
  linkedin_url?: string;
  website_url?: string;
  notification_preferences?: object;
  is_online: boolean;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

// Authentication Request/Response Interfaces
export interface UserRegistrationRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LogoutRequestRequest {
  refresh: string;
}

export interface LogoutResponse {
  message: string;
}

export interface PasswordResetRequestRequest {
  email: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export interface AvatarUploadRequest {
  avatar: File;
}

// Organization-related Interfaces
export interface OrganizationBasic {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  organization_type: OrganizationTypeEnum;
  subscription_plan: SubscriptionPlanEnum;
  is_active: boolean;
}

export interface Organization extends OrganizationBasic {
  description: string;
  logo: string;
  logo_url: string;
  website_url: string;
  owner: UserBasic;
  organization_settings: {
    additionalProp1?: string;
    additionalProp2?: string;
    additionalProp3?: string;
    [key: string]: any;
  };
  subscription_plan: SubscriptionPlanEnum;
  member_count: number;
  workspace_count: number;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  logo?: File;
  website_url?: string;
  organization_type?: OrganizationTypeEnum;
  subscription_plan?: SubscriptionPlanEnum;
  organization_settings?: {
    additionalProp1?: string;
    additionalProp2?: string;
    additionalProp3?: string;
    [key: string]: any;
  };
  is_active?: boolean;
}

export interface OrganizationMember {
  id: string;
  organization: OrganizationBasic;
  user: UserBasic;
  role: OrganizationMemberRoleEnum;
  status: OrganizationMemberStatusEnum;
  permissions: object;
  invited_by: UserBasic;
  invited_at: string;
  joined_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberRequest {
  user_id?: number;
  email?: string;
  role?: OrganizationMemberRoleEnum;
  status?: OrganizationMemberStatusEnum;
  permissions?: object;
  is_active?: boolean;
}

export interface PatchedOrganizationMemberRequest {
  role?: OrganizationMemberRoleEnum;
  status?: OrganizationMemberStatusEnum;
  permissions?: object;
  is_active?: boolean;
}

// Workspace-related Interfaces
export interface WorkspaceBasic {
  id: string;
  name: string;
  slug: string;
  workspace_type: WorkspaceTypeEnum;
  visibility: VisibilityEnum;
  cover_image_url: string;
  is_active: boolean;
}

export interface Workspace extends WorkspaceBasic {
  organization_details: OrganizationBasic;
  description: string;
  workspace_settings: object;
  created_by: UserBasic;
  member_count: number;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRequest {
  name: string;
  slug: string;
  description?: string;
  workspace_type?: WorkspaceTypeEnum;
  visibility?: VisibilityEnum;
  cover_image?: File;
  workspace_settings?: object;
  is_active?: boolean;
  organization?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace: string;
  user: User;
  role: WorkspaceMemberRoleEnum;
  permissions: object;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface WorkspaceMemberRequest {
  workspace: string;
  user_id?: string;
  email?: string;
  role?: WorkspaceMemberRoleEnum;
  permissions?: object;
  is_active?: boolean;
}

// Project-related Interfaces
export interface ProjectBasic {
  id: string;
  name: string;
  slug: string;
  key?: string;
  methodology?: MethodologyEnum;
  status: Status0acEnum;
  priority: PriorityEnum;
  is_active: boolean;
}

export interface Project extends ProjectBasic {
  workspace: Workspace;
  workspace_details: WorkspaceBasic;
  description?: string;
  lead?: UserBasic;
  start_date?: string;
  due_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget?: number;
  progress?: number;
  cover_image_url?: string;
  attachments_url?: string;
  project_settings?: object;
  created_by?: UserBasic;
  team_member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRequest {
  name: string;
  slug: string;
  workspace: string;
  key?: string;
  description?: string;
  methodology?: MethodologyEnum;
  status?: Status0acEnum;
  priority?: PriorityEnum;
  start_date?: string;
  due_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget?: number;
  cover_image?: File;
  attachments?: File;
  project_settings?: object;
  is_active?: boolean;
}

export interface ProjectConfig {
  project: ProjectBasic;
  sprint_duration: SprintDurationEnum;
  auto_close_sprints: boolean;
  estimation_type: EstimationTypeEnum;
  story_point_scale: object;
  enable_time_tracking: boolean;
  require_time_logging: boolean;
  enable_sub_tasks: boolean;
  email_notifications: boolean;
  slack_notifications: boolean;
  slack_webhook_url: string;
  restrict_issue_visibility: boolean;
  require_approval_for_changes: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectConfigRequest {
  project: ProjectBasic | string;
  sprint_duration?: SprintDurationEnum;
  auto_close_sprints?: boolean;
  estimation_type?: EstimationTypeEnum;
  story_point_scale?: object;
  enable_time_tracking?: boolean;
  require_time_logging?: boolean;
  enable_sub_tasks?: boolean;
  email_notifications?: boolean;
  slack_notifications?: boolean;
  slack_webhook_url?: string;
  restrict_issue_visibility?: boolean;
  require_approval_for_changes?: boolean;
}

// Logging-related Interfaces
export interface SystemLog {
  id: string;
  level: LevelEnum;
  action: string;
  action_type: string;
  message: string;
  user?: User;
  ip_address: string;
  user_agent: string;
  request_method: string;
  request_path: string;
  request_data: object;
  response_status: number | null;
  execution_time: number | null;
  metadata: object;
  stack_trace: string;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  severity: SeverityEnum;
  message: string;
  stack_trace?: string;
  request_data?: object;
  user?: UserBasic;
  url: string;
  method: string;
  status: ErrorLogStatusEnum;
  resolved_by?: UserBasic;
  resolved_at?: string;
  notes?: string;
  timestamp: string;
}

// Base Pagination Interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Paginated Lists
export interface PaginatedOrganizationList extends PaginatedResponse<Organization> { }
export interface PaginatedWorkspaceList extends PaginatedResponse<Workspace> { }
export interface PaginatedProjectList extends PaginatedResponse<Project> { }
export interface PaginatedOrganizationMemberList extends PaginatedResponse<OrganizationMember> { }
export interface PaginatedWorkspaceMemberList extends PaginatedResponse<WorkspaceMember> { }
export interface PaginatedSystemLogList extends PaginatedResponse<SystemLog> { }
export interface PaginatedErrorLogList extends PaginatedResponse<ErrorLog> { }

// --- Organization Invitation System ---
export interface OrganizationInvitation {
  id: string;
  organization: OrganizationBasic;
  email: string;
  role: OrganizationMemberRoleEnum;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  invited_by: UserBasic;
  invited_at: string;
  accepted_at?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitationRequest {
  email: string;
  role: OrganizationMemberRoleEnum;
}

export interface OrganizationInvitationResponse {
  message: string;
  invitation: OrganizationInvitation;
}

export interface PaginatedOrganizationInvitationList extends PaginatedResponse<OrganizationInvitation> { }

// Query Parameters
// Alias for legacy ApiQueryParams used in some services
export type ApiQueryParams = PaginationParams;

export interface PaginationParams {
  page?: number;
  search?: string;
  ordering?: string;
  role?: string;
  workspace_type?: string;
  email?: string;
  
  // Issue filters - UUID based
  status?: string;
  priority?: string;
  sprint?: string;
  project?: string;
  assignee?: string;
  reporter?: string;
  issue_type?: string;
  board?: string;
  
  // Issue filters - User-friendly (NEW)
  status_name?: string;           // "In Progress", "To Do", "Done"
  status_category?: string;       // "to_do", "in_progress", "done"
  assignee_email?: string;        // "user@example.com"
  reporter_email?: string;        // "user@example.com"
  issue_type_category?: string;   // "epic", "story", "task", "bug"
  project_key?: string;           // "FICCT"
  workspace_key?: string;         // "SCRUM"
  organization?: string;          // UUID
  is_active?: boolean;
}

export interface SystemLogQueryParams extends PaginationParams {
  action_type?: ActionTypeEnum;
  ip_address?: string;
  level?: LevelEnum;
  user?: number;
}

export interface ErrorLogQueryParams extends PaginationParams {
  error_type?: string;
  severity?: SeverityEnum;
  status?: ErrorLogStatusEnum;
}


/*Sprints Interfaces*/
export interface Sprint {
  id: string;
  project: ProjectBasic;
  name: string;
  status: ProjectStatusEnum;
  start_date: Date;
  goal: string | null;
  end_date: Date;
  issue_count: string;
  progress_percentage: string;
  created_at: Date;
  committed_points: string;
  duration_days: number;
  // Optional: Issues loaded separately via GET /issues/?sprint={id}
  issues?: Issue[];
}

export interface SprintBurdown {
  sprint: Sprint;
  total_points: number;
  ideal_line:
  {
    day: number,
    date: Date,
    remaining_points: number
  }[],
  actual_line: {
    day: number,
    date: Date,
    remaining_points: number
  }[]

}

export interface SprintRequest {
  project: string,
  name: string,
  goal: string | null,
  start_date: string,
  end_date: string,
}

export interface IssueType {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface IssueStatus {
  id: string;
  name: string;
  category: string;
  color: string;
  is_initial: boolean;
  is_final: boolean;
}

export interface Issue {
  id: string;
  key?: string;
  title: string;
  description?: string;
  project: ProjectBasic;
  issue_type?: IssueType;
  status?: IssueStatus;
  priority: string;
  assignee?: UserBasic;
  reporter?: UserBasic;
  sprint?: string;
  estimated_hours?: number;
  actual_hours?: number;
  story_points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IssueRequest {
  project: string;
  issue_type: string;
  title: string;
  description?: string;
  priority?: string;
  assignee?: string;
  status?: string;
  sprint?: string;
  estimated_hours?: number;
  actual_hours?: number;
  story_points?: number;
}

// Board-related Interfaces
export interface WorkflowStatus {
  id: string;
  name: string;
  color: string;
  is_initial: boolean;
  is_final: boolean;
}

export interface BoardColumn {
  id: string;
  name: string;
  workflow_status: WorkflowStatus;
  order: number;
  min_wip: number | null;
  max_wip: number | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  project: ProjectBasic;
  name: string;
  description: string;
  board_type: 'kanban' | 'scrum';
  saved_filter: Record<string, any>;
  columns?: BoardColumn[];
  column_count: number;
  issue_count: number;
  created_by: UserBasic;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardRequest {
  project: string;
  name: string;
  description?: string;
  board_type?: 'kanban' | 'scrum';
  saved_filter?: Record<string, any>;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  board_type?: 'kanban' | 'scrum';
  saved_filter?: Record<string, any>;
}

export interface CreateColumnRequest {
  workflow_status_id: string;
  name?: string;
  order?: number;
  min_wip?: number;
  max_wip?: number;
}

export interface UpdateColumnRequest {
  name?: string;
  order?: number;
  min_wip?: number;
  max_wip?: number;
}

export interface MoveIssueRequest {
  column_id: string;
}

export interface BoardFilters {
  assignee?: string[];
  priority?: string[];
  issue_type?: string[];
  search?: string;
}

export interface CreateIssueQuickRequest {
  title: string;
  description?: string;
  issue_type: string;
  priority?: string;
  assignee?: string;
  story_points?: number;
}

// WebSocket Event Interfaces
export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

export type WebSocketEventType =
  | 'user.joined'
  | 'user.left'
  | 'issue.moved'
  | 'issue.created'
  | 'issue.updated'
  | 'issue.deleted'
  | 'column.created'
  | 'column.updated'
  | 'column.deleted';

export interface UserJoinedData {
  user_id: string;
  user_name: string;
}

export interface IssueMovedData {
  issue: Issue;
  from_status: string;
  to_status: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface IssueCreatedData {
  issue: Issue;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface IssueUpdatedData {
  issue: Issue;
  fields_changed: string[];
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface IssueDeletedData {
  issue_id: string;
  issue_key: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ColumnCreatedData {
  column: BoardColumn;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ColumnUpdatedData {
  column: BoardColumn;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ColumnDeletedData {
  column_id: string;
  column_name: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export interface PaginatedBoardList extends PaginatedResponse<Board> { }
export interface PaginatedIssueList extends PaginatedResponse<Issue> { }
export interface PaginatedIssueTypeList extends PaginatedResponse<IssueType> { }

// Issue Links Interfaces
export interface IssueLink {
  id: string;
  source_issue: Issue;
  target_issue: Issue;
  link_type: IssueLinkTypeEnum | string;
  created_at: string;
  created_by: UserBasic;
}

export interface IssueLinkDetail {
  id: string;
  source_issue: {
    id: string;
    key: string;
    title: string;
    priority: PriorityEnum;
    status: IssueStatus;
    assignee?: UserBasic;
    reporter: UserBasic;
    issue_type: IssueType;
    created_at: string;
    updated_at: string;
  };
  target_issue: {
    id: string;
    key: string;
    title: string;
    priority: PriorityEnum;
    status: IssueStatus;
    assignee?: UserBasic;
    reporter: UserBasic;
    issue_type: IssueType;
    created_at: string;
    updated_at: string;
  };
  link_type: IssueLinkTypeEnum | string;
  created_by: UserBasic;
  created_at: string;
}

export interface IssueLinkType {
  id: string;
  name: string;
  inward_description: string;
  outward_description: string;
  is_system: boolean;
}

export interface IssueLinkRequest {
  source_issue_id: string;
  target_issue_id: string;
  link_type: IssueLinkTypeEnum;
}

export interface PaginatedIssueLinkList extends PaginatedResponse<IssueLink> { }

// ===========================
// GITHUB INTEGRATION INTERFACES (Sprint 3)
// ===========================

export interface GitHubRepository {
  full_name: string;
  url: string;
  description?: string;
  default_branch: string;
  visibility: 'public' | 'private';
}

export interface GitHubIntegration {
  id: string;
  project: ProjectBasic;
  repository_url: string;
  installation_id?: string;
  repository_full_name: string;
  access_token?: string;
  last_synced_at?: string;
  sync_commits: boolean;
  sync_pull_requests: boolean;
  auto_link_issues: boolean;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'error';
}

export interface GitHubIntegrationDetail extends GitHubIntegration {
  repository_data?: GitHubRepository;
  commit_count?: number;
  pull_request_count?: number;
}

export interface GitHubIntegrationRequest {
  project: string;
  repository_url: string;
  installation_id?: string;
  access_token?: string;
  sync_commits?: boolean;
  sync_pull_requests?: boolean;
  auto_link_issues?: boolean;
}

export interface PatchedGitHubIntegrationRequest {
  repository_url?: string;
  sync_commits?: boolean;
  sync_pull_requests?: boolean;
  auto_link_issues?: boolean;
}

export interface GitHubCommit {
  id: string;
  integration: string;
  sha: string;
  message: string;
  author_name: string;
  author_email: string;
  author_avatar_url?: string;
  committed_at: string;
  url: string;
  additions?: number;
  deletions?: number;
  files_changed?: number;
  created_at: string;
}

export interface GitHubCommitDetail extends GitHubCommit {
  linked_issues?: Issue[];
  files?: GitHubFile[];
}

export interface GitHubFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  patch?: string;
}

export interface CommitIssueLinkRequest {
  issue_id: string;
}

export interface PullRequestAuthor {
  login: string;
  avatar_url: string;
  url: string;
}

export interface PullRequestReview {
  id: number;
  user: PullRequestAuthor;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  submitted_at: string;
}

export interface GitHubPullRequest {
  id: string;
  integration: string;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  author: PullRequestAuthor;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  url: string;
  additions?: number;
  deletions?: number;
  commits_count?: number;
  reviews?: PullRequestReview[];
  linked_issues?: Issue[];
}

export interface GitHubMetrics {
  total_commits: number;
  total_pull_requests: number;
  open_pull_requests: number;
  merged_pull_requests: number;
  avg_pr_size: number;
  code_churn: number;
  contributors: GitHubContributor[];
  commit_activity: CommitActivity[];
  pr_metrics: PullRequestMetrics;
}

export interface GitHubContributor {
  user: string;
  avatar_url?: string;
  commits: number;
  lines_added: number;
  lines_removed: number;
  pull_requests: number;
}

export interface CommitActivity {
  date: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface PullRequestMetrics {
  avg_merge_time_hours: number;
  avg_review_time_hours: number;
  approval_rate: number;
  merge_rate: number;
}

export interface SmartCommitAction {
  action: 'close' | 'resolve' | 'fix' | 'implement';
  issue_key: string;
  issue_id?: string;
  new_status?: string;
}

export interface SyncCommitsResponse {
  message: string;
  commits_synced: number;
  issues_linked: number;
  smart_actions_performed: SmartCommitAction[];
}

export interface PaginatedGitHubCommitList extends PaginatedResponse<GitHubCommit> { }
export interface PaginatedGitHubIntegrationList extends PaginatedResponse<GitHubIntegration> { }

// ===========================
// DIAGRAM GENERATION INTERFACES (Sprint 3)
// ===========================

export type DiagramType = 'workflow' | 'dependency' | 'roadmap' | 'uml' | 'architecture' | 'burndown' | 'velocity';
export type DiagramFormat = 'svg' | 'png' | 'pdf' | 'json';

export interface DiagramRequestRequest {
  diagram_type: DiagramType;
  project?: string;  // UUID del proyecto
  board?: string;    // UUID del board
  sprint?: string;   // UUID del sprint
  format?: DiagramFormat;
  options?: DiagramOptions;
}

export interface DiagramOptions {
  width?: number;
  height?: number;
  layout?: 'hierarchical' | 'force-directed' | 'circular' | 'timeline';
  include_archived?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  filter?: {
    assignee?: string[];
    priority?: string[];
    status?: string[];
  };
  style?: {
    theme?: 'light' | 'dark';
    color_scheme?: string;
  };
}

export interface DiagramResponse {
  diagram_type: DiagramType;
  format: DiagramFormat;
  data: string | DiagramData;
  metadata?: DiagramMetadata;
  cached?: boolean;
}

export interface DiagramMetadata {
  generated_at: string;
  node_count?: number;
  edge_count?: number;
  cache_key?: string;
  expires_at?: string;
}

// Workflow Diagram Data
export interface WorkflowDiagramData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'start' | 'intermediate' | 'end';
  category?: string;
  color?: string;
  position?: { x: number; y: number };
  issue_count?: number;
}

export interface WorkflowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  transition_count?: number;
}

// Dependency Diagram Data
export interface DependencyDiagramData {
  nodes: DependencyNode[];
  links: DependencyLink[];
  critical_path?: string[];
}

export interface DependencyNode {
  id: string;
  label: string;
  issue_key?: string;
  status: string;
  priority?: string;
  type?: string;
  assignee?: string;
  blocked?: boolean;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: 'blocks' | 'depends_on' | 'relates_to';
  strength?: number;
}

// Roadmap Diagram Data
export interface RoadmapDiagramData {
  sprints: RoadmapSprint[];
  milestones: RoadmapMilestone[];
  timeline: {
    start_date: string;
    end_date: string;
  };
}

export interface RoadmapSprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  issues: RoadmapIssue[];
  committed_points?: number;
  completed_points?: number;
}

export interface RoadmapIssue {
  id: string;
  key: string;
  title: string;
  status: string;
  priority?: string;
  estimate?: number;
  progress: number;
  assignee?: string;
}

export interface RoadmapMilestone {
  id?: string;
  date: string;
  title: string;
  description?: string;
  type?: 'release' | 'demo' | 'deadline' | 'custom';
  achieved?: boolean;
}

// UML Diagram Data
export interface UMLDiagramData {
  diagram_type: 'class' | 'sequence' | 'activity' | 'component';
  classes?: UMLClass[];
  relationships?: UMLRelationship[];
  methods?: UMLMethod[];
  plantuml_code?: string;
  mermaid_code?: string;
}

export interface UMLClass {
  id: string;
  name: string;
  package?: string;
  properties: UMLProperty[];
  methods: UMLMethod[];
  stereotype?: string;
}

export interface UMLProperty {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
}

export interface UMLMethod {
  name: string;
  parameters: UMLParameter[];
  return_type: string;
  visibility: 'public' | 'private' | 'protected';
}

export interface UMLParameter {
  name: string;
  type: string;
}

export interface UMLRelationship {
  from: string;
  to: string;
  type: 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency';
  label?: string;
}

// Architecture Diagram Data
export interface ArchitectureDiagramData {
  layers: ArchitectureLayer[];
  connections: ArchitectureConnection[];
  technologies: TechnologyStack;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'external';
  components: ArchitectureComponent[];
  position?: { x: number; y: number };
}

export interface ArchitectureComponent {
  id: string;
  name: string;
  technology: string;
  description?: string;
  icon?: string;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  protocol?: string;
  label?: string;
  bidirectional?: boolean;
}

export interface TechnologyStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  infrastructure?: string[];
  tools?: string[];
}

export interface IssueComment {
  id: string;
  issue: string; // UUID del issue
  author: UserBasic;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface IssueCommentRequest {
  content: string;
}

export interface PaginatedIssueCommentList extends PaginatedResponse<IssueComment> { }

// Union type for all diagram data
export type DiagramData = 
  | WorkflowDiagramData 
  | DependencyDiagramData 
  | RoadmapDiagramData 
  | UMLDiagramData 
  | ArchitectureDiagramData
  | string;