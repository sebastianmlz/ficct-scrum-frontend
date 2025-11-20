# ML Features Implementation Guide

## Overview

This document provides a comprehensive guide to the Machine Learning features integrated into the Angular FICCT-SCRUM frontend application. These features leverage Django REST API endpoints to provide intelligent predictions and recommendations.

## Table of Contents

1. [Architecture](#architecture)
2. [Implemented Features](#implemented-features)
3. [Core Components](#core-components)
4. [Integration Guide](#integration-guide)
5. [Usage Examples](#usage-examples)
6. [Error Handling](#error-handling)
7. [Caching Strategy](#caching-strategy)
8. [Testing](#testing)

---

## Architecture

### Service Layer

**Location:** `src/app/core/services/ml.service.ts`

The `MlService` provides a centralized interface for all ML-powered endpoints with:
- **Caching**: 5-15 minute TTL depending on feature
- **Type Safety**: Complete TypeScript interfaces
- **Error Handling**: Comprehensive error responses
- **Logging**: Detailed console logging for debugging

### Authentication

**Location:** `src/app/core/interceptors/auth.interceptor.ts`

Enhanced authentication interceptor handles:
- Automatic JWT token attachment
- 401/403 error detection
- Session expiration handling
- Automatic redirect to login on auth failure

### Cache Management

**Location:** `src/app/core/services/ai-cache.service.ts`

Existing AI cache service used for ML predictions:
- LocalStorage-based caching
- TTL management
- Pattern-based invalidation
- Cache statistics tracking

---

## Implemented Features

### 1. Effort Prediction

**Purpose:** Predicts hours required for new issues based on title, description, and type.

**Component:** `ml-predict-effort` (Already exists, enhanced)
**Location:** `src/app/features/projects/project-issues/ml-predict-effort/`

**Key Features:**
- Displays predicted hours with confidence score
- Shows prediction range (min-max hours)
- Color-coded confidence indicator (green/yellow/red)
- AI reasoning explanation
- Similar issues count
- One-click apply to form

**API Endpoint:** `POST /api/v1/ml/predict-effort/`

**Request:**
```typescript
{
  title: string;
  description?: string;
  issue_type: string;
  project_id: string;
}
```

**Response:**
```typescript
{
  predicted_hours: number;
  confidence: number; // 0.0-1.0
  prediction_range: { min: number; max: number };
  method: 'ml_model' | 'similarity' | 'heuristic';
  reasoning: string;
  similar_issues?: any[];
}
```

**Cache TTL:** 5 minutes

---

### 2. Story Points Recommendation

**Purpose:** Suggests story points for issues based on similar historical issues.

**Component:** `ml-recommend-points` (Already exists, enhanced)
**Location:** `src/app/features/projects/project-issues/ml-recommend-points/`

**Key Features:**
- Recommended points (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
- **NEW:** Probability distribution bar chart
- Confidence score visualization
- AI reasoning
- Based on similar issues count
- One-click apply to form

**API Endpoint:** `POST /api/v1/ml/recommend-story-points/`

**Request:**
```typescript
{
  title: string;
  description?: string;
  issue_type: string;
  project_id: string;
}
```

**Response:**
```typescript
{
  recommended_points: number;
  confidence: number;
  probability_distribution?: { [key: string]: number }; // e.g., {"3": 0.2, "5": 0.5}
  reasoning: string;
  method: string;
  similar_issues_count?: number;
}
```

**Cache TTL:** 5 minutes

---

### 3. Task Assignment Suggestions

**Purpose:** Recommends optimal team members for issue assignment.

**Component:** `ml-suggest-assignment` (Already exists)
**Location:** `src/app/features/projects/project-issues/ml-suggest-assignment/`

**Key Features:**
- Top N suggestions (configurable, default 3)
- Match score (0-100%)
- Individual scoring breakdown:
  - Skill score
  - Workload score
  - Performance score
  - Availability score
- Reasoning array
- User avatars/initials

**API Endpoint:** `POST /api/v1/ml/suggest-assignment/`

**Request:**
```typescript
{
  issue_id: string;
  project_id: string;
  top_n?: number; // Default 3
}
```

**Response:**
```typescript
{
  suggestions: [
    {
      user_id: string;
      username: string;
      user_email: string;
      total_score: number; // 0.0-1.0
      skill_score: number;
      workload_score: number;
      performance_score: number;
      availability_score: number;
      reasoning: string[];
    }
  ]
}
```

**Cache TTL:** 5 minutes

---

### 4. Sprint Risk Detection

**Purpose:** Identifies potential sprint risks in real-time.

**Component:** `sprint-risk-detection` (NEW)
**Location:** `src/app/features/projects/project-sprints/sprint-risk-detection/`

**Key Features:**
- Collapsible badge with risk count
- Severity levels: High, Medium, Low
- Color-coded indicators
- Risk descriptions
- Mitigation suggestions
- Auto-refresh every 15 minutes
- Manual refresh option

**API Endpoint:** `GET /api/v1/ml/{sprint_id}/sprint-risk/`

**Response:**
```typescript
{
  risks: [
    {
      risk_type: string; // e.g., 'burndown_velocity', 'unassigned_issues'
      severity: 'low' | 'medium' | 'high';
      description: string;
      mitigation_suggestions?: string[];
      // Optional specific fields
      unassigned_count?: number;
      stalled_count?: number;
      capacity_ratio?: number;
    }
  ]
}
```

**Cache TTL:** 15 minutes

**Integration:**
```html
<!-- In Sprint Detail/Dashboard -->
<app-sprint-risk-detection 
  [sprintId]="sprint.id"
  [autoRefresh]="true">
</app-sprint-risk-detection>
```

---

### 5. Project Summary

**Purpose:** AI-powered project health dashboard with key metrics.

**Component:** `project-ml-summary` (NEW)
**Location:** `src/app/features/projects/components/project-ml-summary/`

**Key Features:**
- 3 metric cards: Completion, Velocity, Risk Score
- Circular progress visualization
- Color-coded risk levels (Healthy/Caution/Critical)
- Detailed metrics breakdown
- Auto-refresh every 5 minutes
- Manual refresh with cache clear

**API Endpoint:** `POST /api/v1/ml/{project_id}/project-summary/`

**Response:**
```typescript
{
  completion: number; // 0-100
  velocity: number;
  risk_score: number; // 0-100
  project_id: string;
  generated_at: string; // ISO 8601
  metrics_breakdown: {
    total_issues: number;
    completed_issues: number;
    sprints_analyzed: number;
    unassigned_issues: number;
    overdue_issues: number;
  }
}
```

**Cache TTL:** 5 minutes

**Integration:**
```html
<!-- In Project Dashboard -->
<app-project-ml-summary 
  [projectId]="project.id"
  [autoRefresh]="true">
</app-project-ml-summary>
```

---

### 6. Sprint Duration Estimation

**Purpose:** Estimates actual sprint completion time based on workload.

**Component:** Not yet created (API ready)
**Location:** To be implemented in sprint planning

**API Endpoint:** `POST /api/v1/ml/estimate-sprint-duration/`

**Request:**
```typescript
{
  sprint_id: string;
  planned_issues?: string[];
  team_capacity_hours?: number;
}
```

**Response:**
```typescript
{
  estimated_days: number;
  planned_days?: number;
  confidence: number;
  method: string;
  risk_factors: string[];
  average_velocity?: number;
  total_story_points?: number;
}
```

---

## Core Components

### Already Implemented

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `MlPredictEffortComponent` | `project-issues/ml-predict-effort/` | ✅ Enhanced | Effort prediction modal |
| `MlRecommendPointsComponent` | `project-issues/ml-recommend-points/` | ✅ Enhanced | Story points recommendation with probability distribution |
| `MlSuggestAssignmentComponent` | `project-issues/ml-suggest-assignment/` | ✅ Exists | Assignment suggestions |
| `IssueCreateComponent` | `project-issues/issue-create/` | ✅ Integrated | Uses ML predictions via buttons |

### Newly Created

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `SprintRiskDetectionComponent` | `project-sprints/sprint-risk-detection/` | ✅ NEW | Sprint risk monitoring |
| `ProjectMlSummaryComponent` | `projects/components/project-ml-summary/` | ✅ NEW | Project health dashboard |

---

## Integration Guide

### 1. Adding Effort Prediction to Issue Form

The issue creation form already has ML integration. To add to other forms:

```typescript
// Component
import { MlPredictEffortComponent } from '../ml-predict-effort/ml-predict-effort.component';

@Component({
  imports: [CommonModule, ReactiveFormsModule, MlPredictEffortComponent],
  // ...
})
export class YourComponent {
  showPredictEffort = signal(false);
  
  openPredictEffort(): void {
    const title = this.form.get('title')?.value;
    if (!title || title.trim().length < 3) {
      return; // Require minimum title length
    }
    this.showPredictEffort.set(true);
  }
  
  applyPrediction(hours: number): void {
    this.form.patchValue({ estimated_hours: hours });
    this.showPredictEffort.set(false);
  }
}
```

```html
<!-- Template -->
<button type="button" (click)="openPredictEffort()">
  AI Predict Effort
</button>

<app-ml-predict-effort
  *ngIf="showPredictEffort()"
  [title]="form.get('title')?.value"
  [description]="form.get('description')?.value"
  [issueType]="form.get('issue_type')?.value"
  [projectId]="projectId"
  (close)="showPredictEffort.set(false)"
  (predictionApplied)="applyPrediction($event)">
</app-ml-predict-effort>
```

### 2. Adding Sprint Risk to Sprint Detail Page

```typescript
// sprint-detail.component.ts
import { SprintRiskDetectionComponent } from '../sprint-risk-detection/sprint-risk-detection.component';

@Component({
  imports: [CommonModule, SprintRiskDetectionComponent],
  // ...
})
export class SprintDetailComponent {
  // Component code
}
```

```html
<!-- sprint-detail.component.html -->
<div class="sprint-detail-header">
  <!-- Sprint info -->
</div>

<!-- Add Risk Detection -->
<div class="mb-4">
  <app-sprint-risk-detection 
    [sprintId]="sprint.id"
    [autoRefresh]="true">
  </app-sprint-risk-detection>
</div>

<!-- Rest of sprint details -->
```

### 3. Adding Project Summary to Dashboard

```typescript
// project-dashboard.component.ts (or similar)
import { ProjectMlSummaryComponent } from '../components/project-ml-summary/project-ml-summary.component';

@Component({
  imports: [CommonModule, ProjectMlSummaryComponent],
  // ...
})
export class ProjectDashboardComponent {
  @Input() projectId!: string;
}
```

```html
<!-- project-dashboard.component.html -->
<div class="dashboard-container">
  <h1>Project Overview</h1>
  
  <!-- ML Summary at top -->
  <app-project-ml-summary 
    [projectId]="projectId"
    [autoRefresh]="true">
  </app-project-ml-summary>
  
  <!-- Rest of dashboard -->
</div>
```

---

## Usage Examples

### Clearing Cache on Data Changes

When issues, sprints, or project data changes significantly:

```typescript
import { MlService } from '@core/services/ml.service';

export class IssueEditComponent {
  private mlService = inject(MlService);
  
  async updateIssue(): Promise<void> {
    // Update issue
    await this.issueService.updateIssue(data).toPromise();
    
    // Clear ML cache for this project
    this.mlService.clearProjectCache(this.projectId);
  }
}
```

### Sprint Risk Polling

Sprint risk automatically polls every 15 minutes. To disable:

```html
<app-sprint-risk-detection 
  [sprintId]="sprint.id"
  [autoRefresh]="false">
</app-sprint-risk-detection>
```

### Manual Refresh

Both Sprint Risk and Project Summary components support manual refresh:

```typescript
// In template
<app-project-ml-summary #mlSummary [projectId]="projectId">
</app-project-ml-summary>

<button (click)="mlSummary.manualRefresh()">Refresh Now</button>
```

---

## Error Handling

### HTTP Error Responses

All ML components handle these error scenarios:

| Status | Error Type | User Message |
|--------|------------|--------------|
| 0 | Network | "Connection lost. Check your internet and try again." |
| 400 | Bad Request | "Please provide valid issue details." |
| 401/403 | Unauthorized | Auto-logout + "Session expired. Please log in again." |
| 404 | Not Found | "Project/Sprint not found. Please refresh and try again." |
| 500 | Server Error | "Prediction service temporarily unavailable. Please try again later." |

### Session Expiration Flow

1. ML API call returns 401/403
2. Auth interceptor catches error
3. Clears localStorage (access, refresh, user, user_role)
4. Shows notification: "Session expired. Please log in again."
5. Redirects to `/login`
6. ML component stops processing

### Fallback Behavior

If ML prediction fails:
- Component shows error message
- Provides "Retry" button
- User can still manually input values
- Form remains functional

---

## Caching Strategy

### Cache Keys

```typescript
// Effort prediction
`effort_${projectId}_${title}_${issueType}`

// Story points
`points_${projectId}_${title}_${issueType}`

// Assignment
`assignment_${projectId}_${issueId}`

// Sprint risk
`sprint_risk_${sprintId}`

// Project summary
`project_summary_${projectId}`
```

### TTL (Time To Live)

| Feature | TTL | Reason |
|---------|-----|--------|
| Effort Prediction | 5 min | Form values change frequently |
| Story Points | 5 min | Form values change frequently |
| Assignment | 5 min | Team availability changes |
| Sprint Risk | 15 min | Sprint data relatively stable |
| Project Summary | 5 min | Dashboard should be fresh |

### Invalidation

**Automatic:**
- TTL expiration triggers fresh API call

**Manual:**
- Clear project cache: `mlService.clearProjectCache(projectId)`
- Clear sprint cache: `mlService.clearSprintCache(sprintId)`
- Pattern invalidation: `cacheService.invalidatePattern('effort_PROJECT123')`

---

## Testing

### Unit Tests (Recommended)

```typescript
// ml.service.spec.ts
describe('MlService', () => {
  it('should cache effort predictions', () => {
    // Test caching behavior
  });
  
  it('should return cached data within TTL', () => {
    // Test cache hit
  });
  
  it('should fetch fresh data after TTL expiration', () => {
    // Test cache miss
  });
});
```

### Integration Tests

1. **Effort Prediction Flow:**
   - Open issue creation form
   - Enter title and description
   - Click "AI Predict Effort"
   - Verify modal opens
   - Verify prediction loads
   - Click "Apply Prediction"
   - Verify hours populate in form

2. **Sprint Risk Detection:**
   - Navigate to active sprint
   - Verify risk badge appears
   - Click badge to expand
   - Verify risks load
   - Verify severity colors correct

3. **Project Summary:**
   - Navigate to project dashboard
   - Verify 3 metric cards appear
   - Verify completion percentage correct
   - Verify velocity displays
   - Verify risk score color-coded

### E2E Tests (Playwright/Cypress)

```typescript
test('ML effort prediction flow', async ({ page }) => {
  await page.goto('/projects/123/issues/create');
  await page.fill('input[formControlName="title"]', 'Fix login bug');
  await page.click('button:has-text("AI Predict Effort")');
  await page.waitForSelector('.prediction');
  const hours = await page.textContent('.predicted-hours');
  expect(Number(hours)).toBeGreaterThan(0);
  await page.click('button:has-text("Apply Prediction")');
  const inputValue = await page.inputValue('input[formControlName="estimated_hours"]');
  expect(Number(inputValue)).toBeGreaterThan(0);
});
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Cache TTL |
|----------|--------|---------|-----------|
| `/api/v1/ml/predict-effort/` | POST | Effort prediction | 5 min |
| `/api/v1/ml/recommend-story-points/` | POST | Story points | 5 min |
| `/api/v1/ml/suggest-assignment/` | POST | Assignment suggestions | 5 min |
| `/api/v1/ml/{sprintId}/sprint-risk/` | GET | Sprint risks | 15 min |
| `/api/v1/ml/{projectId}/project-summary/` | POST | Project summary | 5 min |
| `/api/v1/ml/estimate-sprint-duration/` | POST | Sprint duration | N/A |

---

## Next Steps

### Phase 1 (Complete) ✅
- [x] ML Service with caching
- [x] Auth interceptor enhancements
- [x] Effort prediction component
- [x] Story points recommendation with probability distribution
- [x] Error handling for all components

### Phase 2 (Complete) ✅
- [x] Sprint risk detection component
- [x] Project summary dashboard component

### Phase 3 (Optional)
- [ ] Sprint duration estimation component
- [ ] Assignment suggestions in assignee dropdown (top 3)
- [ ] Inline predictions (without modal)
- [ ] Debouncing for auto-predictions
- [ ] Advanced visualizations (D3.js charts)

---

## Support

For issues or questions:
1. Check console logs (prefixed with `[ML Service]`, `[ML Predict Effort]`, etc.)
2. Verify backend API is running on `${environment.apiUrl}/api/v1/ml/`
3. Check localStorage cache: `localStorage.getItem('ai_cache_effort_...')`
4. Review network tab for API call status

---

## License

Part of the FICCT-SCRUM project.
