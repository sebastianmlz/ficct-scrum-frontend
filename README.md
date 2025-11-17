# FICCT Scrum Frontend

Project management and collaboration platform with AI-powered features, diagram generation, and GitHub integration.

## Technology Stack

**Framework:** Angular 19.2.0  
**Language:** TypeScript 5.7.2  
**HTTP Client:** HttpClient (built-in)  
**Styling:** Tailwind CSS 3.4.17, PrimeNG 20.1.1, PrimeIcons 7.0.0  
**Charts:** D3.js 7.9.0, Chart.js 4.5.1, ngx-charts 23.0.1, ngx-graph 0.9.2  
**Diagrams:** Mermaid 11.12.0  
**State Management:** Angular Signals (built-in), NgRx Signals 18.0.0, NgRx Store 18.0.0  
**UI Components:** PrimeNG 20.1.1, Spartan-ng 0.0.1-alpha.380, Lucide Angular 0.363.0  
**Build Tool:** Angular CLI 19.2.4  
**Test Framework:** Jasmine 5.6.0, Karma 6.4.0  
**Server:** Express.js 4.18.2 (production static file serving)

## Architecture

### Application Structure

The application uses a feature-based modular architecture with standalone components:

- **Core folder**: Application-wide singletons including services, guards, interceptors, stores, and models.
- **Shared folder**: Reusable components and utilities used across features.
- **Features folders**: Domain-specific modules organized by business capability.

#### Main Features

- **Dashboard**: Overview of user's projects, workspaces, organizations, and recent activity.
- **Organizations**: Multi-tenant organization management with member roles.
- **Workspaces**: Logical grouping of related projects within organizations.
- **Projects**: Project creation, configuration, issue tracking, sprint management, and GitHub integration.
- **Boards**: Kanban board implementation with drag-and-drop support for issue management.
- **Diagrams**: AI-generated workflow diagrams, dependency graphs, UML diagrams, roadmap timelines, and architecture diagrams using D3.js, Mermaid, and custom renderers.
- **Notifications**: Real-time notification system with WebSocket integration.
- **Profile**: User profile management with avatar upload.
- **Admin**: System administration including logs, error tracking, and Pinecone synchronization.
- **Auth**: Authentication flow with login, registration, password reset, and token management.

### Routing

All routes use lazy loading via `loadComponent` and `loadChildren` for code splitting and performance optimization. Route guards control access:

- **authGuard**: Protects authenticated routes, redirects to login if no valid token.
- **guestGuard**: Protects guest-only routes (login/register), redirects authenticated users to dashboard.

Feature modules define their own route configurations imported via `loadChildren` pattern.

### State Management

The application uses multiple state management approaches:

- **Angular Signals**: Primary reactivity mechanism for component state (introduced in Angular 16+).
- **NgRx Signals**: Used in `AuthStore` for centralized authentication state management.
- **Services with BehaviorSubject**: Traditional observable patterns for data services.
- **NgRx Store**: Available for complex state scenarios requiring effects and devtools.

#### AuthStore Pattern

The `AuthStore` service manages global authentication state using signals:

- Computed signals for derived state: `isLoggedIn`, `currentUser`, `isSuperUser`, `isStaff`.
- Token refresh mechanism with JWT expiration checking.
- Persistent authentication via localStorage with automatic initialization.
- Centralized login/logout flow with state synchronization.

### Component Patterns

The codebase follows a component-based architecture:

- **Smart components**: Feature components that inject services, manage state, and handle business logic.
- **Presentational components**: Shared components that receive data via `@Input()` and emit events via `@Output()`.
- **Standalone components**: All components are standalone (no NgModule declarations).

Shared components include: AI chat, avatar upload, diagram controls, error boundary, file upload, GitHub prompts, issue detail modal, loading skeleton, logo upload, Mermaid viewer, notifications, pagination, and quick assignee popover.

### API Communication

All HTTP communication is encapsulated in services within `core/services/`:

- **Base URL**: Configured in environment files (`environment.ts`, `environment.development.ts`, `environment.prod.ts`).
- **Interceptors**: 
  - `AuthInterceptor` (class-based): Attaches JWT Bearer tokens to authorized requests, skips auth endpoints.
  - `aiDeduplicationInterceptor` (functional): Prevents duplicate AI requests within 60-second window using request caching.
- **Error handling**: Services use RxJS `catchError` operator for error transformation.
- **Response parsing**: Services map HTTP responses to typed interfaces defined in `core/models/`.

Key services: `AuthService`, `ProjectService`, `IssueService`, `BoardService`, `DiagramService`, `AIService`, `GitHubIntegrationService`, `WebSocketService`, `NotificationService`, `OrganizationService`, `WorkspaceService`.

## Project Structure

```
src/
  app/
    core/
      guards/           - Route guards (authGuard, guestGuard)
      interceptors/     - HTTP interceptors (auth, AI deduplication)
      models/           - TypeScript interfaces and enums
      services/         - Injectable services for API and business logic
      store/            - State management stores (AuthStore)
    shared/
      components/       - Reusable UI components (15+ shared components)
      utils/            - Utility functions and helpers
    features/
      admin/            - Admin dashboard, logs, error tracking
      auth/             - Login, register, forgot password, reset password
      boards/           - Kanban board components and services
      dashboard/        - Main dashboard with stats and activity feed
      notifications/    - Notification list and components
      organizations/    - Organization CRUD and member management
      profile/          - User profile and settings
      projects/         - Project management, issues, sprints, GitHub integration, diagrams
      workspaces/       - Workspace CRUD and navigation
    layout/
      footer/           - Application footer
      header/           - Top navigation bar
      sidebar/          - Side navigation menu
    app.component.ts    - Root component
    app.config.ts       - Application providers configuration
    app.routes.ts       - Root routing configuration
  environments/
    environment.ts              - Default environment (apiUrl, wsUrl)
    environment.development.ts  - Development environment
    environment.prod.ts         - Production environment
  assets/               - Static files
  styles.css            - Global styles (Tailwind imports, PrimeNG layer configuration)
  index.html            - HTML entry point
  main.ts               - Bootstrap application
angular.json            - Angular CLI configuration
package.json            - Dependencies and scripts
tailwind.config.js      - Tailwind CSS configuration
tsconfig.json           - TypeScript compiler configuration
server.js               - Express server for production static file serving
```

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Angular CLI 19.2.4

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ficct-scrum-frontend

# Install dependencies
npm install

# Install Angular CLI globally (if not already installed)
npm install -g @angular/cli@19.2.4
```

### Environment Configuration

Configure API endpoints in environment files:

- **Local development**: `src/environments/environment.ts` (default: `http://localhost:8000`)
- **Dev environment**: `src/environments/environment.development.ts` 
- **Production**: `src/environments/environment.prod.ts`

Environment variables:
- `apiUrl`: Backend REST API base URL
- `wsUrl`: WebSocket server URL for real-time features

Environment file replacement is configured in `angular.json` under `fileReplacements` for each build configuration.

### Development Server

```bash
# Start development server (uses environment.development.ts)
npm run dev

# Or use Angular CLI directly
ng serve
```

Development server runs at `http://localhost:4200/` with automatic reload on file changes.

### Build Script

The `scripts/set-env.js` script runs before production builds to dynamically set environment variables from runtime environment.

## Key Features

### Dashboard

Displays aggregated statistics, recent projects, and activity feed. Loads data from multiple services in parallel using `Promise.all()`. Shows organization count, workspace count, project count, and user activity timeline.

### Project Management

- **Project listing**: Filterable and searchable project grid with pagination.
- **Project creation**: Form-based project creation with workspace assignment.
- **Project detail**: Tabbed interface with dashboard, issues, sprints, activity, GitHub integration, and diagram generation.
- **Issue management**: Full CRUD operations with status transitions, assignments, labels, and sprint association.
- **Sprint management**: Create, edit, and track sprints with start/end dates and goal setting.

### Boards

Kanban board implementation with:
- Multiple board types (kanban, scrum)
- Drag-and-drop functionality for issue movement between columns
- Custom column configuration
- Real-time updates via WebSocket connection
- `trackBy` functions for optimized list rendering

### Reporting and Diagrams

All diagrams support multiple rendering formats (SVG, JSON) and include error handling with retry logic:

- **Workflow Diagram**: D3.js force-directed graph showing issue dependencies and workflow states with zoom and pan controls.
- **Dependency Graph**: Visualizes issue relationships and blocking dependencies using ngx-graph or D3.js.
- **Roadmap Timeline**: Sprint-based timeline visualization showing project milestones and progress.
- **UML Diagram**: Mermaid-based class diagram generation from GitHub repository analysis.
- **Architecture Diagram**: System architecture visualization with component relationships.

Diagrams use `DiagramService` for API communication, `DiagramRendererService` for D3.js rendering, and `MermaidGeneratorService` for Mermaid syntax generation. Caching is implemented on the backend with cache status indicators in the UI.

### AI Features

AI-powered functionality using OpenAI GPT models:

- **Semantic search**: Vector-based issue search using Pinecone embeddings with metadata filtering.
- **AI chat**: Conversational interface for project queries with conversation history and source citations.
- **AI query**: One-shot question answering with relevant issue sources.
- **Deduplication**: Automatic prevention of duplicate AI requests within 60-second window.

AI requests support different timeout configurations: 10s for standard models (GPT-4o), 45s for reasoning models (o1-preview), 10 minutes for full Pinecone synchronization.

### GitHub Integration

OAuth-based GitHub integration for:
- Repository connection to projects
- Commit history fetching and display
- Pull request listing with status tracking
- Code metrics dashboard
- Commit-to-issue linking for traceability
- Repository synchronization

### Real-time Updates

WebSocket integration via `WebSocketService`:
- Automatic reconnection with exponential backoff (max 5 attempts, up to 30s delay)
- Message broadcasting to subscribed components via RxJS Subject
- Connection state management with open/close observers
- Used for board updates, notifications, and activity feed

## API Integration

### Authentication

**Token storage**: JWT access and refresh tokens stored in localStorage (`access`, `refresh`).

**Auth header format**: `Authorization: Bearer <token>`

**Login flow**:
1. User submits credentials to `AuthService.login()`.
2. Backend returns `LoginResponse` with access/refresh tokens and user object.
3. Tokens stored in localStorage and `AuthStore` state updated.
4. `AuthGuard` verifies token on protected routes.

**Logout flow**:
1. Call `AuthStore.logout()` which sends refresh token to backend.
2. Clear localStorage tokens and reset AuthStore state.
3. Redirect to login page.

**Token refresh**: `AuthStore.getValidToken()` checks JWT expiration and automatically refreshes using refresh token when needed.

### HTTP Interceptors

**AuthInterceptor** (class-based):
- Runs on all HTTP requests
- Skips endpoints: `/api/v1/auth/login/`, `/api/v1/auth/register/`, `/api/v1/auth/password-reset-request/`, `/api/v1/auth/password-reset-confirm/`, `/api/v1/auth/token/refresh/`
- Adds `Authorization` and `Content-Type` headers to authorized requests

**aiDeduplicationInterceptor** (functional):
- Only intercepts `/api/v1/ai/` endpoints
- Caches successful responses with request hash as key
- Returns cached response if duplicate request within 60-second window
- Automatically cleans expired cache entries
- Logs all blocked and allowed requests

### Services

**AuthService**: Login, registration, password reset, user profile, avatar upload, token refresh.

**ProjectService**: Project CRUD, member management, configuration.

**IssueService**: Issue CRUD, status transitions, assignments, comments, attachments.

**BoardService**: Board CRUD, column management.

**DiagramService**: Workflow, dependency, roadmap, UML, architecture diagram generation.

**AIService**: AI chat, semantic search, AI query, conversation management, Pinecone sync.

**GitHubIntegrationService**: OAuth flow, repository management, commit/PR fetching, metrics.

**WebSocketService**: WebSocket connection, reconnection logic, message broadcasting.

**NotificationService**: Notification creation, listing, marking as read.

**OrganizationService**: Organization CRUD, member management.

**WorkspaceService**: Workspace CRUD, project association.

**SprintsService**: Sprint CRUD, issue association.

**DashboardService**: Dashboard statistics and activity feed.

All services use typed interfaces from `core/models/` for request/response contracts.

## Styling

### Approach

The application uses a hybrid styling approach:

- **Tailwind CSS 3.4.17**: Utility-first CSS framework for custom component styling
- **PrimeNG 20.1.1**: Component library for complex UI elements (tables, dialogs, dropdowns)
- **PrimeIcons 7.0.0**: Icon set
- **Tailwind plugins**: `tailwindcss-animate` for animations

### Layer Configuration

Global styles in `src/styles.css` use CSS layers to manage style precedence:

```css
@layer tailwind-base, primeng, tailwind-utilities;
```

This ensures PrimeNG component styles are sandwiched between Tailwind base and utilities, allowing Tailwind utility overrides.

### Component Styling

- Scoped styles: Component-specific CSS/SCSS files (e.g., `workflow-diagram.component.scss`)
- Inline Tailwind classes: Utility classes in component templates
- PrimeNG theming: Configured via PrimeNG CSS layer

### Responsive Design

Tailwind responsive breakpoints used throughout: `sm:`, `md:`, `lg:`, `xl:` prefixes for mobile-first responsive design.

## Forms

### Implementation

**Reactive Forms**: All forms use Angular Reactive Forms with `FormBuilder` and `FormGroup`.

**Validation patterns**:
- Built-in validators: `Validators.required`, `Validators.email`, `Validators.minLength`
- Custom validators where needed
- Async validation for unique constraints (e.g., username availability)

**Error message display**: Template-driven error messages with `*ngIf` checking form control validity and touched state.

### Form Examples

- Login: Email and password with required validators
- Registration: Multi-field form with password confirmation matching
- Issue creation: Complex form with multiple fields (title, description, assignee, priority, status, sprint)
- Sprint creation: Date range validation and goal setting
- Project configuration: Settings form with toggle switches and text inputs

## Performance

### Change Detection

Standard change detection strategy is used. No explicit `ChangeDetectionStrategy.OnPush` implementations found in codebase.

### Lazy Loading

All feature modules use lazy loading via Angular Router's `loadComponent` and `loadChildren`:
- Reduces initial bundle size
- Code splitting at route level
- On-demand loading of feature code

### Optimization Techniques

**trackBy functions**: Used in board components for optimized list rendering:
- `trackByColumnId` in board detail component
- `trackByIssueId` in board column component

**Signal-based reactivity**: Modern Angular signals provide fine-grained reactivity and automatic change detection optimization.

**HTTP caching**: AI deduplication interceptor caches responses to reduce redundant API calls.

**Asset optimization**: Angular CLI production build includes tree-shaking, minification, and bundle optimization.

### Bundle Size Budgets

Configured in `angular.json`:
- Initial bundle: 500kB warning, 1MB error
- Component styles: 50kB warning, 50kB error

## Build and Deployment

### Build Commands

```bash
# Development build (includes source maps)
npm run watch

# Production build (optimized)
npm run build

# Direct Angular CLI build
ng build --configuration production
```

### Build Output

Production build output: `dist/ficct-scrum-frontend/browser/`

### Environment Builds

Build configurations defined in `angular.json`:

- **development**: Source maps enabled, no optimization, uses `environment.development.ts`
- **production** (default): Optimized, minified, tree-shaken, uses `environment.prod.ts`

Environment file replacement via `fileReplacements` in build configuration.

### Deployment

**Static file hosting**: Built application is static HTML/CSS/JS requiring simple HTTP server.

**SPA routing**: Server must redirect all routes to `index.html` for client-side routing.

**Production server**: Included Express.js server (`server.js`) serves static files and handles SPA routing:

```bash
# Start production server
npm start
```

Server runs on port 3000 (or `process.env.PORT`) and serves files from `dist/ficct-scrum-frontend/browser/`.

**Environment setup**: Run `scripts/set-env.js` before build to inject runtime environment variables.

## Code Patterns

### Service Pattern

Services are injectable singletons:
- `@Injectable({ providedIn: 'root' })` for application-wide services
- Constructor injection using `inject()` function (modern approach) or constructor parameters

### Component Communication

**Parent-child**: `@Input()` for data flow down, `@Output()` with `EventEmitter` for events up.

**Sibling communication**: Shared services with RxJS Subject/BehaviorSubject.

**Global state**: AuthStore with signals for authentication state.

### Observable Patterns

**Subscription management**: Manual subscriptions in component code (no systematic unsubscribe pattern detected).

**Async pipe**: Used in templates for automatic subscription management: `data$ | async`.

**RxJS operators**: Extensive use of `map`, `catchError`, `tap`, `switchMap`, `throttleTime`, `timeout`, `retry`, `retryWhen`, `delayWhen`.

### Error Handling

**Global error interceptor**: `aiDeduplicationInterceptor` includes catchError for AI requests.

**Service-level error handling**: Services use `catchError` to transform errors into user-friendly messages.

**Component error states**: Components track error state in signals/properties and display error messages in templates.

**Error boundary component**: `ErrorBoundaryComponent` provides reusable error UI.

**Diagram error handling**: Dedicated `DiagramErrorState` type and `diagram-error.utils` for diagram-specific error analysis and retry logic.

## Testing

**Framework**: Jasmine 5.6.0

**Test runner**: Karma 6.4.0

**Browser**: Chrome (karma-chrome-launcher)

**Coverage**: karma-coverage

### Run Tests

```bash
npm test
```

This executes unit tests with Karma test runner in watch mode.

## Browser Support

Target browsers determined by TypeScript ES2022 compilation and Angular 19 support:
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2022 feature support required
- No explicit polyfills configured

## Known Limitations

**Subscription cleanup**: No systematic async pipe or takeUntil pattern for subscription management in all components.

**Change detection**: Not using OnPush strategy which could improve performance in list-heavy components.

**Error recovery**: Some services lack comprehensive error retry logic beyond basic catchError.

**WebSocket reconnection**: Limited to 5 reconnection attempts with exponential backoff before giving up permanently.
