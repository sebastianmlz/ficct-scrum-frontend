import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-diagram-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagram-controls-wrapper">
      <div class="controls-panel">
        <!-- Zoom Controls -->
        <button
          (click)="onZoomIn()"
          class="control-btn"
          title="Zoom In"
          [disabled]="loading">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>

        <button
          (click)="onZoomOut()"
          class="control-btn"
          title="Zoom Out"
          [disabled]="loading">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        <button
          (click)="onResetZoom()"
          class="control-btn"
          title="Reset View"
          [disabled]="loading">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div class="divider"></div>

        <!-- Export Controls -->
        <div class="export-dropdown">
          <button
            (click)="toggleExportMenu()"
            class="control-btn"
            title="Export Diagram"
            [disabled]="loading">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span class="ml-1">Export</span>
          </button>

          @if (showExportMenu) {
            <div class="export-menu">
              <button (click)="onExportSVG()" class="export-option">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Export as SVG</span>
              </button>
              <button (click)="onExportPNG()" class="export-option">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Export as PNG</span>
              </button>
            </div>
          }
        </div>

        <div class="divider"></div>

        <!-- Refresh Button -->
        <button
          (click)="onRefresh()"
          class="control-btn"
          title="Refresh Diagram"
          [disabled]="loading">
          <svg 
            class="w-5 h-5" 
            [class.animate-spin]="loading"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .diagram-controls-wrapper {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    }

    .controls-panel {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border: 1px solid #DFE1E6;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: #42526E;
      font-size: 14px;
      transition: all 0.2s;
    }

    .control-btn:hover:not(:disabled) {
      background: #F4F5F7;
      color: #0052CC;
    }

    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: #DFE1E6;
    }

    .export-dropdown {
      position: relative;
    }

    .export-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #DFE1E6;
      min-width: 180px;
      overflow: hidden;
      z-index: 20;
    }

    .export-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #172B4D;
      font-size: 14px;
      text-align: left;
      transition: background 0.2s;
    }

    .export-option:hover {
      background: #F4F5F7;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .diagram-controls-wrapper {
        top: 10px;
        right: 10px;
      }

      .controls-panel {
        padding: 6px;
        gap: 6px;
      }

      .control-btn {
        padding: 6px;
      }

      .control-btn span {
        display: none;
      }
    }
  `]
})
export class DiagramControlsComponent {
  @Input() loading = false;
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() exportSVG = new EventEmitter<void>();
  @Output() exportPNG = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  showExportMenu = false;

  onZoomIn(): void {
    this.zoomIn.emit();
  }

  onZoomOut(): void {
    this.zoomOut.emit();
  }

  onResetZoom(): void {
    this.resetZoom.emit();
  }

  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  onExportSVG(): void {
    this.exportSVG.emit();
    this.showExportMenu = false;
  }

  onExportPNG(): void {
    this.exportPNG.emit();
    this.showExportMenu = false;
  }

  onRefresh(): void {
    this.refresh.emit();
  }
}
