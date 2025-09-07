import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              Welcome, {{ authStore.currentUser()?.first_name || 'User' }}!
            </span>
            <button 
              (click)="logout()" 
              class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div class="text-center">
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                FICCT-SCRUM Dashboard
              </h2>
              <p class="text-gray-600 mb-8">
                Welcome to your project management dashboard
              </p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                <div class="bg-white p-6 rounded-lg shadow">
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Organizations</h3>
                  <p class="text-gray-600 text-sm mb-4">Manage your organizations</p>
                  <a href="/organizations" class="text-primary hover:text-primary/80 font-medium">
                    View Organizations →
                  </a>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Workspaces</h3>
                  <p class="text-gray-600 text-sm mb-4">Access your workspaces</p>
                  <a href="/workspaces" class="text-primary hover:text-primary/80 font-medium">
                    View Workspaces →
                  </a>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Projects</h3>
                  <p class="text-gray-600 text-sm mb-4">Manage your projects</p>
                  <a href="/projects" class="text-primary hover:text-primary/80 font-medium">
                    View Projects →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  public authStore = inject(AuthStore);

  ngOnInit(): void {
    // Initialize auth state if needed
    this.authStore.initializeAuth();
  }

  async logout(): Promise<void> {
    await this.authStore.logout();
  }
}
