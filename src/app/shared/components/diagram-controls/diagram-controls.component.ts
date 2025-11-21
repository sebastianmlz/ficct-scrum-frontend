import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-diagram-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'diagram-controls.component.html',
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
  `],
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
