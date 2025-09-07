import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent, FileUploadEvent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule, FileUploadComponent],
  template: `
    <div class="flex flex-col items-center space-y-4">
      @if (currentAvatarUrl && !newAvatarPreview) {
        <div class="relative">
          <img 
            [src]="currentAvatarUrl" 
            [alt]="altText"
            class="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
          >
          <button
            type="button"
            (click)="showUploader = true"
            class="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>
        </div>
      }

      @if (!currentAvatarUrl || showUploader) {
        <div class="w-full max-w-md">
          <app-file-upload
            accept="image/jpeg,image/png,image/gif,image/webp"
            [maxSize]="2 * 1024 * 1024"
            maxSizeDisplay="2MB"
            acceptedFormats="JPG, PNG, GIF, WebP up to 2MB"
            (fileSelected)="onAvatarSelected($event)"
            (fileRemoved)="onAvatarRemoved()"
            (uploadError)="onUploadError($event)"
          />
        </div>
      }

      @if (newAvatarPreview) {
        <div class="flex flex-col items-center space-y-2">
          <img 
            [src]="newAvatarPreview" 
            alt="New avatar preview"
            class="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
          >
          <div class="flex space-x-2">
            <button
              type="button"
              (click)="confirmAvatar()"
              class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Use This Avatar
            </button>
            <button
              type="button"
              (click)="cancelAvatar()"
              class="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class AvatarUploadComponent {
  @Input() currentAvatarUrl?: string;
  @Input() altText: string = 'Avatar';
  
  @Output() avatarSelected = new EventEmitter<File>();
  @Output() avatarRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  showUploader = false;
  newAvatarPreview?: string | null;
  selectedFile?: File;

  onAvatarSelected(event: FileUploadEvent): void {
    this.selectedFile = event.file;
    this.newAvatarPreview = event.preview;
  }

  onAvatarRemoved(): void {
    this.newAvatarPreview = undefined;
    this.selectedFile = undefined;
    this.showUploader = false;
  }

  onUploadError(error: string): void {
    this.uploadError.emit(error);
  }

  confirmAvatar(): void {
    if (this.selectedFile) {
      this.avatarSelected.emit(this.selectedFile);
      this.showUploader = false;
    }
  }

  cancelAvatar(): void {
    this.newAvatarPreview = undefined;
    this.selectedFile = undefined;
    this.showUploader = false;
  }
}
