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
  organization: OrganizationBasic;
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
  status?: string;
  priority?: string;
  sprint?: string;
  project?: string;
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