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
  template: 'pagination.component.html',
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
