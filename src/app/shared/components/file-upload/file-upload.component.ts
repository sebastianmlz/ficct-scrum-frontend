import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FileUploadEvent {
  file: File;
  preview?: string | null;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <div class="flex items-center justify-center w-full">
        <label 
          for="file-upload"
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          [class.border-blue-500]="isDragOver()"
          [class.bg-blue-50]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            @if (preview()) {
              <div class="relative mb-4">
                <img 
                  [src]="preview()" 
                  [alt]="fileName()"
                  class="w-32 h-32 object-cover rounded-lg shadow-md"
                >
                <button
                  type="button"
                  (click)="removeFile($event)"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            } @else {
              <svg class="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
            }
            
            <p class="mb-2 text-sm text-gray-500">
              @if (!fileName()) {
                <span class="font-semibold">Click to upload</span> or drag and drop
              } @else {
                <span class="font-semibold">{{ fileName() }}</span>
              }
            </p>
            
            @if (!fileName()) {
              <p class="text-xs text-gray-500">{{ acceptedFormats }}</p>
            }
            
            @if (maxSizeDisplay && !fileName()) {
              <p class="text-xs text-gray-400">Max size: {{ maxSizeDisplay }}</p>
            }
          </div>
          
          <input 
            id="file-upload" 
            type="file" 
            class="hidden" 
            [accept]="accept"
            (change)="onFileSelected($event)"
          />
        </label>
      </div>
      
      @if (error()) {
        <p class="mt-2 text-sm text-red-600">{{ error() }}</p>
      }
      
      @if (isUploading()) {
        <div class="mt-4">
          <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{{ uploadProgress() }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              [style.width.%]="uploadProgress()"
            ></div>
          </div>
        </div>
      }
    </div>
  `
})
export class FileUploadComponent {
  @Input() accept: string = 'image/*';
  @Input() maxSize: number = 5 * 1024 * 1024; // 5MB default
  @Input() maxSizeDisplay: string = '5MB';
  @Input() acceptedFormats: string = 'PNG, JPG, GIF up to 5MB';
  @Input() multiple: boolean = false;
  
  @Output() fileSelected = new EventEmitter<FileUploadEvent>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  // Signals for reactive state
  isDragOver = signal(false);
  preview = signal<string | null>(null);
  fileName = signal<string | null>(null);
  error = signal<string | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.error.set(null);

    // Validate file size
    if (file.size > this.maxSize) {
      const sizeMB = (this.maxSize / (1024 * 1024)).toFixed(1);
      this.error.set(`File size must be less than ${sizeMB}MB`);
      this.uploadError.emit(this.error() || '');
      return;
    }

    // Validate file type
    if (!file.type.match(this.accept.replace('*', '.*'))) {
      this.error.set('Invalid file type. Please select a valid file.');
      this.uploadError.emit(this.error() || '');
      return;
    }

    this.fileName.set(file.name);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Emit file selected event
    this.fileSelected.emit({
      file,
      preview: this.preview()
    });
  }

  removeFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.preview.set(null);
    this.fileName.set(null);
    this.error.set(null);
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    
    // Clear the input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.fileRemoved.emit();
  }

  // Method to simulate upload progress (can be called from parent component)
  setUploadProgress(progress: number): void {
    this.uploadProgress.set(Math.min(100, Math.max(0, progress)));
    this.isUploading.set(progress < 100);
  }

  // Method to set upload state
  setUploading(uploading: boolean): void {
    this.isUploading.set(uploading);
    if (!uploading) {
      this.uploadProgress.set(0);
    }
  }

  // Method to set error from parent component
  setError(error: string | null): void {
    this.error.set(error);
  }
}
