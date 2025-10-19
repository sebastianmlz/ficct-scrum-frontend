// Enums for FICCT-SCRUM API

export enum OrganizationTypeEnum {
  STARTUP = 'startup',
  CORPORATION = 'corporation',
  NON_PROFIT = 'non_profit',
  GOVERNMENT = 'government',
  EDUCATIONAL = 'educational',
  OTHER = 'other'
}

export enum SubscriptionPlanEnum {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum OrganizationMemberRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum OrganizationMemberStatusEnum {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export enum WorkspaceMemberRoleEnum {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum WorkspaceTypeEnum {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  MARKETING = 'marketing',
  SALES = 'sales',
  SUPPORT = 'support',
  HR = 'hr',
  FINANCE = 'finance',
  GENERAL = 'general',
  TEAM = 'team',
  PROJECT = 'project',
  DEPARTMENT = 'department',
  OTHER = 'other'
}

export enum VisibilityEnum {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted'
}

export enum MethodologyEnum {
  SCRUM = 'scrum',
  KANBAN = 'kanban',
  WATERFALL = 'waterfall',
  HYBRID = 'hybrid'
}

export enum Status0acEnum {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum ProjectStatusEnum {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum ProjectPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum PriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SprintDurationEnum {
  ONE_WEEK = 1,
  TWO_WEEKS = 2,
  THREE_WEEKS = 3,
  FOUR_WEEKS = 4
}

export enum EstimationTypeEnum {
  STORY_POINTS = 'story_points',
  HOURS = 'hours',
  T_SHIRT = 't_shirt'
}

export enum TimezoneEnum {
  UTC = 'UTC',
  AMERICA_NEW_YORK = 'America/New_York',
  AMERICA_CHICAGO = 'America/Chicago',
  AMERICA_DENVER = 'America/Denver',
  AMERICA_LOS_ANGELES = 'America/Los_Angeles',
  EUROPE_LONDON = 'Europe/London',
  EUROPE_PARIS = 'Europe/Paris',
  ASIA_TOKYO = 'Asia/Tokyo',
  ASIA_SHANGHAI = 'Asia/Shanghai',
  AUSTRALIA_SYDNEY = 'Australia/Sydney'
}

export enum LanguageEnum {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  PT = 'pt',
  ZH = 'zh',
  JA = 'ja'
}

export enum ActionTypeEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

export enum LevelEnum {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum SeverityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorLogStatusEnum {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

