import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent, FileUploadEvent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule, FileUploadComponent],
  template: `
    <div class="flex flex-col space-y-4">
      @if (currentLogoUrl && !newLogoPreview) {
        <div class="relative inline-block">
          <img 
            [src]="currentLogoUrl" 
            [alt]="altText"
            class="w-32 h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 shadow-sm"
          >
          <button
            type="button"
            (click)="showUploader = true"
            class="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </button>
        </div>
      }

      @if (!currentLogoUrl || showUploader) {
        <div class="w-full">
          <app-file-upload
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            [maxSize]="5 * 1024 * 1024"
            maxSizeDisplay="5MB"
            acceptedFormats="JPG, PNG, GIF, WebP, SVG up to 5MB"
            (fileSelected)="onLogoSelected($event)"
            (fileRemoved)="onLogoRemoved()"
            (uploadError)="onUploadError($event)"
          />
        </div>
      }

      @if (newLogoPreview) {
        <div class="flex flex-col space-y-3">
          <div class="flex justify-center">
            <img 
              [src]="newLogoPreview" 
              alt="New logo preview"
              class="w-32 h-32 object-contain bg-gray-50 rounded-lg border-2 border-blue-200 shadow-sm"
            >
          </div>
          <div class="flex justify-center space-x-3">
            <button
              type="button"
              (click)="confirmLogo()"
              class="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Use This Logo
            </button>
            <button
              type="button"
              (click)="cancelLogo()"
              class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      }

      @if (showRemoveOption && currentLogoUrl && !showUploader) {
        <div class="flex justify-center">
          <button
            type="button"
            (click)="removeLogo()"
            class="px-3 py-1 text-red-600 text-sm font-medium hover:text-red-800 transition-colors"
          >
            Remove Logo
          </button>
        </div>
      }
    </div>
  `
})
export class LogoUploadComponent {
  @Input() currentLogoUrl?: string;
  @Input() altText: string = 'Logo';
  @Input() showRemoveOption: boolean = true;
  
  @Output() logoSelected = new EventEmitter<File>();
  @Output() logoRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  showUploader = false;
  newLogoPreview?: string | null;
  selectedFile?: File;

  onLogoSelected(event: FileUploadEvent): void {
    this.selectedFile = event.file;
    this.newLogoPreview = event.preview;
  }

  onLogoRemoved(): void {
    this.newLogoPreview = undefined;
    this.selectedFile = undefined;
    this.showUploader = false;
  }

  onUploadError(error: string): void {
    this.uploadError.emit(error);
  }

  confirmLogo(): void {
    if (this.selectedFile) {
      this.logoSelected.emit(this.selectedFile);
      this.showUploader = false;
    }
  }

  cancelLogo(): void {
    this.newLogoPreview = undefined;
    this.selectedFile = undefined;
    this.showUploader = false;
  }

  removeLogo(): void {
    this.logoRemoved.emit();
  }
}
