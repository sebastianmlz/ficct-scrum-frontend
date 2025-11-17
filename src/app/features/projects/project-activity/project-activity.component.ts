import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActivityLogService, ActivityLog } from '../../../core/services/activity-log.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-activity',
  imports: [CommonModule, RouterLink],
  templateUrl: './project-activity.component.html',
  styleUrl: './project-activity.component.css'
})
export class ProjectActivityComponent implements OnInit {
  private activityLogService = inject(ActivityLogService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);

  projectId = '';
  projectKey = '';
  
  loading = signal(false);
  activities = signal<ActivityLog[]>([]);
  error = signal<string | null>(null);

  // Filter states
  selectedActionType = signal<string>('');
  selectedObjectType = signal<string>('');
  
  // Pagination
  currentPage = signal(1);
  totalCount = signal(0);
  hasMore = signal(false);
  loadingMore = signal(false);
  
  // Expose Object for template
  Object = Object;

  ngOnInit(): void {
    // Get project ID from parent route params
    this.route.parent?.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProjectKey();
      }
    });
  }

  async loadProjectKey(): Promise<void> {
    try {
      const project = await this.projectService.getProject(this.projectId).toPromise();
      if (project?.key) {
        this.projectKey = project.key;
      }
      // Load activities with project UUID, not key
      this.loadActivities();
    } catch (error) {
      console.error('Error loading project:', error);
      // Still try to load activities with projectId even if project fetch fails
      this.loadActivities();
    }
  }

  async loadActivities(page: number = 1): Promise<void> {
    const isLoadingMore = page > 1;
    
    if (isLoadingMore) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
      this.currentPage.set(1);
    }
    
    this.error.set(null);

    try {
      const params: any = {
        project: this.projectId,  // Use project UUID instead of project_key
        ordering: '-created_at',
        page: page,
        limit: 20  // Changed to 20 per page for better pagination
      };

      // Add filters if selected
      if (this.selectedActionType()) {
        params.action_type = this.selectedActionType();
      }
      if (this.selectedObjectType()) {
        params.object_type = this.selectedObjectType();
      }

      const response = await this.activityLogService.getActivityLogs(params).toPromise();
      
      // Log API response for debugging
      console.log('[ACTIVITY FEED] API Response:', {
        count: response?.count,
        hasNext: !!response?.next,
        resultsLength: response?.results?.length,
        page: page
      });
      
      // Log first activity to verify structure
      if (response?.results && response.results.length > 0) {
        console.log('[ACTIVITY FEED] Sample activity:', response.results[0]);
        console.log('[ACTIVITY FEED] 🔗 object_url:', response.results[0].object_url);
        console.log('[ACTIVITY FEED] 🔗 object_type:', response.results[0].object_type);
        console.log('[ACTIVITY FEED] 🔗 object_id:', response.results[0].object_id);
      }
      
      // Log all object URLs for navigation debugging
      response?.results?.forEach((activity, index) => {
        if (activity.object_url) {
          console.log(`[ACTIVITY FEED] Activity ${index}: ${activity.action_type} ${activity.object_type} → URL: ${activity.object_url}`);
        }
      });
      
      if (isLoadingMore) {
        // Append to existing activities
        this.activities.set([...this.activities(), ...(response?.results || [])]);
      } else {
        // Replace activities
        this.activities.set(response?.results || []);
      }
      
      this.currentPage.set(page);
      this.totalCount.set(response?.count || 0);
      this.hasMore.set(!!response?.next);
    } catch (error: any) {
      console.error('Error loading activities:', error);
      this.error.set('Failed to load activity history');
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  loadMore(): void {
    if (!this.loadingMore() && this.hasMore()) {
      this.loadActivities(this.currentPage() + 1);
    }
  }

  filterByActionType(actionType: string): void {
    this.selectedActionType.set(actionType === this.selectedActionType() ? '' : actionType);
    this.loadActivities();
  }

  filterByObjectType(objectType: string): void {
    this.selectedObjectType.set(objectType === this.selectedObjectType() ? '' : objectType);
    this.loadActivities();
  }

  clearFilters(): void {
    this.selectedActionType.set('');
    this.selectedObjectType.set('');
    this.loadActivities();
  }

  getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'created': 'M12 4v16m8-8H4',
      'updated': 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L16.732 3.732z',
      'deleted': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      'transitioned': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      'commented': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      'assigned': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'attached': 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
      'linked': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    };
    return icons[actionType] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  getActionColor(actionType: string): string {
    const colors: Record<string, string> = {
      'created': 'text-green-600 bg-green-100',
      'updated': 'text-blue-600 bg-blue-100',
      'deleted': 'text-red-600 bg-red-100',
      'transitioned': 'text-purple-600 bg-purple-100',
      'commented': 'text-yellow-600 bg-yellow-100',
      'assigned': 'text-indigo-600 bg-indigo-100',
      'attached': 'text-pink-600 bg-pink-100',
      'linked': 'text-teal-600 bg-teal-100'
    };
    return colors[actionType] || 'text-gray-600 bg-gray-100';
  }

  logNavigation(activity: ActivityLog): void {
    console.log('[ACTIVITY FEED] 🔗 View link clicked');
    console.log('[ACTIVITY FEED] 🔗 Navigating to:', activity.object_url);
    console.log('[ACTIVITY FEED] 🔗 Object type:', activity.object_type);
    console.log('[ACTIVITY FEED] 🔗 Object ID:', activity.object_id);
    console.log('[ACTIVITY FEED] 🔗 Action type:', activity.action_type);
  }
}

