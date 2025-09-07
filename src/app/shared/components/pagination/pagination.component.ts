import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6" aria-label="Pagination">
      <div class="hidden sm:block">
        <p class="text-sm text-gray-700">
          Showing
          <span class="font-medium">{{ startItem() }}</span>
          to
          <span class="font-medium">{{ endItem() }}</span>
          of
          <span class="font-medium">{{ totalItems }}</span>
          results
        </p>
      </div>
      
      <div class="flex flex-1 justify-between sm:justify-end">
        <button
          type="button"
          (click)="previousPage()"
          [disabled]="!hasPrevious"
          class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
          </svg>
          Previous
        </button>
        
        <div class="hidden md:flex">
          @for (page of visiblePages(); track page) {
            @if (page === '...') {
              <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                ...
              </span>
            } @else {
              <button
                type="button"
                (click)="goToPage(+page)"
                [class]="getPageButtonClass(+page)"
              >
                {{ page }}
              </button>
            }
          }
        </div>
        
        <button
          type="button"
          (click)="nextPage()"
          [disabled]="!hasNext"
          class="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <svg class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Mobile pagination info -->
      <div class="flex flex-1 justify-between sm:hidden">
        <p class="text-sm text-gray-700">
          Page {{ currentPage }} of {{ totalPages }}
        </p>
      </div>
    </nav>
    
    <!-- Page size selector -->
    @if (showPageSizeSelector) {
      <div class="flex items-center justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-700">Items per page:</label>
          <select
            [value]="pageSize"
            (change)="onPageSizeChange($event)"
            class="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            @for (size of pageSizeOptions; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      </div>
    }
  `
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() hasNext: boolean = false;
  @Input() hasPrevious: boolean = false;
  @Input() showPageSizeSelector: boolean = true;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() maxVisiblePages: number = 7;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // Computed values for display
  startItem = computed(() => {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  });

  endItem = computed(() => {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.totalItems);
  });

  // Generate visible page numbers with ellipsis
  visiblePages = computed(() => {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = this.maxVisiblePages;

    if (total <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current <= 4) {
        // Current page is near the beginning
        for (let i = 2; i <= Math.min(5, total - 1); i++) {
          pages.push(i);
        }
        if (total > 5) {
          pages.push('...');
        }
      } else if (current >= total - 3) {
        // Current page is near the end
        if (total > 5) {
          pages.push('...');
        }
        for (let i = Math.max(total - 4, 2); i <= total - 1; i++) {
          pages.push(i);
        }
      } else {
        // Current page is in the middle
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
      }

      // Always show last page (if not already included)
      if (total > 1) {
        pages.push(total);
      }
    }

    return pages;
  });

  previousPage(): void {
    if (this.hasPrevious) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.hasNext) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newSize);
  }

  getPageButtonClass(page: number): string {
    const baseClass = 'relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0';
    
    if (page === this.currentPage) {
      return `${baseClass} z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`;
    } else {
      return `${baseClass} text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0`;
    }
  }
}
