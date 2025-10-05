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
  template: 'file-upload.component.html',
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
