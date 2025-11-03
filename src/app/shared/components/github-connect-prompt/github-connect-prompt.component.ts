import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Reusable component for prompting users to connect GitHub
 * Used in metrics, diagrams, commits, and other GitHub-dependent features
 */
@Component({
  selector: 'app-github-connect-prompt',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="w-full bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
      <!-- GitHub Icon -->
      <div class="flex justify-center mb-6">
        <svg class="w-20 h-20 md:w-24 md:h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
        </svg>
      </div>

      <!-- Title -->
      <h3 class="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
        {{ title || 'GitHub Integration Required' }}
      </h3>

      <!-- Message -->
      <p class="text-sm md:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
        {{ message || 'Connect your GitHub repository to access commit history, code metrics, pull requests, and advanced analytics.' }}
      </p>

      <!-- Features List -->
      @if (showFeatures) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto text-left">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p class="font-medium text-gray-900">Commit Tracking</p>
              <p class="text-sm text-gray-600">Sync and link commits to issues</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p class="font-medium text-gray-900">Code Metrics</p>
              <p class="text-sm text-gray-600">View code quality and statistics</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p class="font-medium text-gray-900">Pull Requests</p>
              <p class="text-sm text-gray-600">Track and manage PRs</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p class="font-medium text-gray-900">Diagrams</p>
              <p class="text-sm text-gray-600">Generate architecture and dependency diagrams</p>
            </div>
          </div>
        </div>
      }

      <!-- Action Button -->
      <button 
        [routerLink]="projectId ? ['/projects', projectId, 'config'] : ['/projects']"
        [fragment]="'integrations'"
        class="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md hover:shadow-lg">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        {{ buttonLabel || 'Connect GitHub' }}
      </button>

      <!-- Secondary Link -->
      @if (showLearnMore) {
        <p class="mt-4 text-sm text-gray-500">
          <a href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps" 
             target="_blank" 
             rel="noopener noreferrer"
             class="text-blue-600 hover:text-blue-700 underline">
            Learn more about GitHub integration
          </a>
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GitHubConnectPromptComponent {
  @Input() projectId?: string;
  @Input() title?: string;
  @Input() message?: string;
  @Input() buttonLabel?: string;
  @Input() showFeatures = true;
  @Input() showLearnMore = true;
}
