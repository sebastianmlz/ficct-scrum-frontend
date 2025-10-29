import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramFormat } from '../../../core/models/interfaces';

export interface ExportOption {
  format: DiagramFormat;
  label: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

@Component({
  selector: 'app-diagram-export-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left">
      <!-- Export Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        [disabled]="disabled"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        [ngClass]="{
          'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500': !exporting(),
          'bg-blue-400 cursor-wait': exporting()
        }">
        @if (exporting()) {
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        } @else {
          <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Export
        }
        <svg class="-mr-1 ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50">
          <!-- Dropdown Header -->
          <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 class="text-sm font-semibold text-gray-900">Export Diagram</h3>
            <p class="text-xs text-gray-500 mt-0.5">Choose your preferred format</p>
          </div>

          <!-- Export Options -->
          <div class="py-2">
            @for (option of exportOptions; track option.format) {
              <button
                type="button"
                (click)="onExportFormat(option.format)"
                [disabled]="exporting()"
                class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group">
                <div class="flex items-start">
                  <!-- Icon -->
                  <div class="flex-shrink-0 mt-0.5">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                         [ngClass]="{
                           'bg-purple-100 text-purple-600': option.format === 'svg',
                           'bg-blue-100 text-blue-600': option.format === 'png',
                           'bg-red-100 text-red-600': option.format === 'pdf',
                           'bg-gray-100 text-gray-600': option.format === 'json'
                         }">
                      {{ option.icon }}
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="ml-3 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {{ option.label }}
                      </span>
                      @if (option.recommended) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Recommended
                        </span>
                      }
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5">{{ option.description }}</p>
                  </div>
                </div>
              </button>
            }
          </div>

          <!-- Dropdown Footer -->
          <div class="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p class="text-xs text-gray-500">
              <svg class="inline h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              Exports are generated on demand and may take a few seconds
            </p>
          </div>
        </div>
      }

      <!-- Backdrop for mobile -->
      @if (isOpen()) {
        <div 
          class="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
          (click)="closeDropdown()">
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Smooth dropdown animation */
    .origin-top-right {
      animation: dropdown-appear 0.15s ease-out;
    }

    @keyframes dropdown-appear {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Touch-friendly on mobile */
    @media (max-width: 768px) {
      .origin-top-right {
        position: fixed;
        right: 1rem;
        left: 1rem;
        width: auto;
        max-width: none;
      }
    }
  `]
})
export class DiagramExportDropdownComponent {
  @Input() disabled = false;
  @Input() exporting = signal(false);
  
  @Output() exportFormat = new EventEmitter<DiagramFormat>();

  isOpen = signal(false);

  exportOptions: ExportOption[] = [
    {
      format: 'svg',
      label: 'SVG',
      description: 'Vector format, scalable and editable',
      icon: '📊',
      recommended: true
    },
    {
      format: 'png',
      label: 'PNG',
      description: 'High-quality raster image',
      icon: '🖼️'
    },
    {
      format: 'json',
      label: 'JSON',
      description: 'Raw data structure for developers',
      icon: '💾'
    }
  ];

  toggleDropdown(): void {
    if (!this.disabled && !this.exporting()) {
      this.isOpen.update(value => !value);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onExportFormat(format: DiagramFormat): void {
    this.closeDropdown();
    this.exportFormat.emit(format);
  }
}
