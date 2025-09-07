import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'card') {
      <div class="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div class="flex space-x-4">
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-12 w-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    } @else if (type === 'project') {
      <div class="animate-pulse border border-gray-200 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-full mb-3"></div>
            <div class="flex space-x-4">
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="ml-4">
            <div class="h-6 w-16 bg-gray-200 rounded-full mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-12 mb-1"></div>
            <div class="w-20 h-1.5 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    } @else if (type === 'activity') {
      <div class="animate-pulse relative pb-8">
        <div class="relative flex space-x-3">
          <div class="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div class="min-w-0 flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    } @else if (type === 'stat') {
      <div class="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div class="h-12 w-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    } @else {
      <!-- Default line skeleton -->
      <div class="animate-pulse">
        @for (line of getLines(); track $index) {
          <div 
            class="h-4 bg-gray-200 rounded mb-2"
            [style.width]="line + '%'"
          ></div>
        }
      </div>
    }
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'project' | 'activity' | 'stat' | 'lines' = 'lines';
  @Input() lines: number = 3;

  getLines(): number[] {
    const widths = [100, 80, 60, 90, 70];
    return Array.from({ length: this.lines }, (_, i) => widths[i % widths.length]);
  }
}
