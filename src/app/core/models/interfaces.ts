// TypeScript interfaces for FICCT-SCRUM API

import {
  OrganizationTypeEnum,
  SubscriptionPlanEnum,
  OrganizationMemberRoleEnum,
  OrganizationMemberStatusEnum,
  WorkspaceMemberRoleEnum,
  ProjectMemberRoleEnum,
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

// Re-export enums for convenience
export {
  OrganizationTypeEnum,
  SubscriptionPlanEnum,
  OrganizationMemberRoleEnum,
  OrganizationMemberStatusEnum,
  WorkspaceMemberRoleEnum,
  ProjectMemberRoleEnum,
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
};

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

// Project Member-related Interfaces
export interface ProjectMember {
  id: string;
  project: string;
  user: UserBasic;
  role: ProjectMemberRoleEnum;
  permissions: object;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberRequest {
  project: string;
  user_id?: string;
  email?: string;
  role?: ProjectMemberRoleEnum;
  permissions?: object;
  is_active?: boolean;
}

export interface PatchedProjectMemberRequest {
  role?: ProjectMemberRoleEnum;
  permissions?: object;
  is_active?: boolean;
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
export type PaginatedOrganizationList = PaginatedResponse<Organization>
export type PaginatedWorkspaceList = PaginatedResponse<Workspace>
export type PaginatedProjectList = PaginatedResponse<Project>
export type PaginatedOrganizationMemberList =
PaginatedResponse<OrganizationMember>
export type PaginatedWorkspaceMemberList = PaginatedResponse<WorkspaceMember>
export type PaginatedProjectMemberList = PaginatedResponse<ProjectMember>
export type PaginatedSystemLogList = PaginatedResponse<SystemLog>
export type PaginatedErrorLogList = PaginatedResponse<ErrorLog>

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

export type PaginatedOrganizationInvitationList =
PaginatedResponse<OrganizationInvitation>;
// Alias for legacy ApiQueryParams used in some services
export type ApiQueryParams = PaginationParams;

export interface PaginationParams {
  page?: number;
  search?: string;
  ordering?: string;
  role?: string;
  workspace_type?: string;
  email?: string;
  workspace?: string; // UUID - Filter by workspace

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
  status_name?: string; // "In Progress", "To Do", "Done"
  status_category?: string; // "to_do", "in_progress", "done"
  assignee_email?: string; // "user@example.com"
  reporter_email?: string; // "user@example.com"
  issue_type_category?: string; // "epic", "story", "task", "bug"
  project_key?: string; // "FICCT"
  workspace_key?: string; // "SCRUM"
  organization?: string; // UUID
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


/* Sprints Interfaces*/
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

export type PaginatedBoardList = PaginatedResponse<Board>
export type PaginatedIssueList = PaginatedResponse<Issue>
export type PaginatedIssueTypeList = PaginatedResponse<IssueType>

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

export type PaginatedIssueLinkList = PaginatedResponse<IssueLink>

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
  integration?: string;
  sha: string; // Full commit hash
  short_sha: string; // First 7 characters
  message: string; // Full commit message (multi-line)
  formatted_message: string; // First line only
  author_name: string;
  author_email: string;
  author_avatar_url?: string;
  commit_date: string; // ISO 8601 timestamp
  branch: string; // Branch name (e.g., "main")
  url: string; // GitHub commit URL
  issue_keys_mentioned: string[]; // Auto-detected issue keys (ex. ["PROJ-123"])
  synced_at: string; // When this commit was synced
  // Legacy/optional fields
  committed_at?: string;
  commit_hash?: string;
  commit_url?: string;
  repository_url?: string;
  additions?: number;
  deletions?: number;
  files_changed?: number;
  created_at?: string;
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
  // Core metrics
  total_commits: number;
  commits_last_30_days?: number;
  avg_commits_per_day?: number;

  // Commit frequency (backend sends as dict)
  commit_frequency?: Record<string, number>; // { "2025-10-04": 5, ... }

  // Contributors (backend sends as array)
  top_contributors?: GitHubContributor[];

  // Pull requests
  total_pull_requests?: number;
  open_pull_requests?: number;
  merged_pull_requests?: number;
  closed_pull_requests?: number;
  avg_pr_size?: number;

  // Legacy fields (for backward compatibility)
  contributors?: GitHubContributor[];
  commit_activity?: CommitActivity[];
  code_churn?: number;
  pr_metrics?: PullRequestMetrics;
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
  message: string; // "Successfully synced 51 commits"
  synced_count: number; // How many NEW commits were synced
  last_sync_at: string; // ISO 8601 timestamp
  total_commits: number; // Total commits in database (historical)
  commits: GitHubCommit[]; // Array of up to 50 commits
  // Legacy fields (optional)
  status?: string;
  sync_count?: number;
  last_sync?: string;
  commits_synced?: number;
  issues_linked?: number;
  smart_actions_performed?: SmartCommitAction[];
}

export type PaginatedGitHubCommitList = PaginatedResponse<GitHubCommit>
export type PaginatedGitHubIntegrationList =
PaginatedResponse<GitHubIntegration>

// OAuth Flow Interfaces
export interface GitHubOAuthRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export interface GitHubOAuthRepositoriesResponse {
  repositories: GitHubOAuthRepository[];
  project_id: string;
  temp_token?: string;
}

export interface GitHubOAuthCompleteRequest {
  temp_token: string;
  repository_url: string;
  repository_name: string;
  project: string;
}

// ===========================
// DIAGRAM GENERATION INTERFACES (Sprint 3)
// ===========================

export type DiagramType = 'workflow' | 'dependency' | 'roadmap' |
'uml' | 'architecture' | 'burndown' | 'velocity';
export type DiagramFormat = 'svg' | 'png' | 'pdf' | 'json';

export interface DiagramRequestRequest {
  diagram_type: DiagramType;
  project?: string; // UUID del proyecto
  board?: string; // UUID del board
  sprint?: string; // UUID del sprint
  format?: DiagramFormat;
  options?: DiagramOptions;
  parameters?: Record<string, any>; // Filter parameters for diagrams
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
  cache_buster?: number; // Timestamp to bust cache on refresh
  force_refresh?: boolean; // Force backend to regenerate diagram (ignore cache)
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
  diagram_type: 'roadmap';
  layout: {
    type: string;
    width: number;
    height: number;
  };
  sprints: RoadmapSprint[];
  milestones: RoadmapMilestone[];
  metadata: {
    project_id: string;
    project_name: string;
    start_date: string;
    end_date: string;
    today: string;
    sprint_count: number;
  };
}

export interface RoadmapSprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed';
  color: string;
  progress: number;
  issue_count: number;
  completed_count: number;
  velocity: number | null;
  // Legacy fields (kept for backward compatibility)
  issues?: RoadmapIssue[];
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
  id: string;
  name: string; // Backend uses 'name' not 'title'
  date: string;
  color: string;
  description?: string;
  type?: 'release' | 'demo' | 'deadline' | 'custom';
  achieved?: boolean;
  // Legacy field (kept for backward compatibility)
  title?: string;
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
  type: 'inheritance' | 'composition' | 'aggregation' |
  'association' | 'dependency';
  label?: string;
}

// Architecture Diagram Data (Backend Structure)
export interface ArchitectureDiagramData {
  project?: {
    id: string;
    name: string;
    key: string;
  };
  architecture_pattern?: string;
  layers: ArchitectureLayer[];
  connections: ArchitectureConnection[];
  technologies?: TechnologyStack;
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  components: ArchitectureComponent[];
}

export interface ArchitectureComponent {
  name: string;
  type: 'viewset' | 'serializer' | 'service' | 'model' | 'middleware' |
  'manager' | 'admin' | 'form' | 'filter';
  app: string;
  description?: string;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  type: 'uses' | 'accesses' | 'calls' | 'imports' | 'extends';
  label?: string;
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

export type PaginatedIssueCommentList = PaginatedResponse<IssueComment>

// Union type for all diagram data
export type DiagramData =
  | WorkflowDiagramData
  | DependencyDiagramData
  | RoadmapDiagramData
  | UMLDiagramData
  | ArchitectureDiagramData
  | string;

// Sprint Report Interfaces
export interface SprintReportMetrics {
  planned_points: number;
  completed_points: number;
  completion_rate: number;
  total_issues: number;
  completed_issues: number;
  incomplete_issues: number;
  velocity: number;
}

export interface SprintReportSprint {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface SprintReport {
  sprint: SprintReportSprint;
  metrics: SprintReportMetrics;
  issues_by_status: Record<string, number>;
  issues_by_type: Record<string, number>;
  defect_rate: number;
}

// Team Metrics Interfaces
export type TeamMetricsUser = object

export interface TeamMetricsAggregates {
  total_issues: number;
  total_completed: number;
  throughput: number;
  avg_cycle_time: number;
  work_in_progress: number;
}

export interface TeamMetricsResponse {
  user_metrics: TeamMetricsUser[];
  team_aggregates: TeamMetricsAggregates;
}

// Velocity Chart Interfaces
export interface VelocityChartResponse {
  labels: string[];
  velocities: number[];
  planned_points: number[];
  average_velocity: number;
}

// Cumulative Flow Diagram Interfaces
export interface CumulativeFlowResponse {
  dates: string[];
  status_counts: Record<string, number[]>;
}

// Export Interfaces
export interface ExportRequest {
  data_type: 'issues' | 'sprints' | 'activity';
  project: string;
  start_date?: string;
  end_date?: string;
  sprint_id?: string;
  status_id?: string;
  assignee_id?: string;
  issue_type_id?: string;
  priority?: string;
  user_id?: string;
  action_type?: string;
}

export interface ExportResponse {
  message: string;
  download_url: string;
  snapshot_id: string;
  rows_exported: number;
  data_type: string;
}
