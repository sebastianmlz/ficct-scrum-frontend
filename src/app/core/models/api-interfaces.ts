// OpenAPI Specification Interfaces

import {Sprint, Issue, IssueType} from './interfaces';

export type OrganizationTypeEnum = 'startup' | 'enterprise' | 'agency' |
'nonprofit' | 'education' | 'government' | 'other';
export type SubscriptionPlanEnum = 'free' | 'basic' | 'professional' |
'enterprise';
export type WorkspaceTypeEnum = 'development' | 'design' | 'marketing' |
'sales' | 'support' | 'hr' | 'finance' | 'general';
export type VisibilityEnum = 'public' | 'private' | 'restricted';
export type MethodologyEnum = 'scrum' | 'kanban' | 'waterfall' | 'hybrid';
export type Status0acEnum = 'planning' | 'active' | 'on_hold' | 'completed'
| 'cancelled' | 'archived';
export type PriorityEnum = 'low' | 'medium' | 'high' | 'critical';

export interface UserBasic {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface OrganizationBasic {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceBasic {
  id: string;
  name: string;
  slug: string;
  organization: OrganizationBasic;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  organization_type: OrganizationTypeEnum;
  subscription_plan: SubscriptionPlanEnum;
  owner: UserBasic;
  member_count: number;
  workspace_count: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  organization: OrganizationBasic;
  name: string;
  slug: string;
  description: string;
  workspace_type: WorkspaceTypeEnum;
  visibility: VisibilityEnum;
  cover_image_url: string;
  created_by: UserBasic;
  member_count: number;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace: WorkspaceBasic;
  name: string;
  key: string;
  description: string;
  methodology: MethodologyEnum;
  status: Status0acEnum;
  priority: PriorityEnum;
  lead: UserBasic;
  start_date: string;
  end_date: string;
  attachments_url: string;
  created_by: UserBasic;
  team_member_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedOrganizationList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Organization[];
}

export interface PaginatedWorkspaceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workspace[];
}

export interface PaginatedProjectList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}

export interface PaginatedSprintList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sprint[];
}

export interface PaginatedIssueList{
  count: number;
  next: string | null;
  previous: string | null;
  results: Issue[];
}

export interface PaginatedIssueTypeList {
  count: number;
  next: string | null;
  previous: string | null;
  results: IssueType[];
}

export interface ApiQueryParams {
  page?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}
