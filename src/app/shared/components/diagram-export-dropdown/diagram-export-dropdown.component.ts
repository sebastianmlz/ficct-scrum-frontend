import {Component, Input, Output, EventEmitter, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DiagramFormat} from '../../../core/models/interfaces';

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
  templateUrl: 'diagram-export-dropdown.component.html',
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
  `],
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
      recommended: true,
    },
    {
      format: 'png',
      label: 'PNG',
      description: 'High-quality raster image',
      icon: '🖼️',
    },
    {
      format: 'json',
      label: 'JSON',
      description: 'Raw data structure for developers',
      icon: '💾',
    },
  ];

  toggleDropdown(): void {
    if (!this.disabled && !this.exporting()) {
      this.isOpen.update((value) => !value);
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
