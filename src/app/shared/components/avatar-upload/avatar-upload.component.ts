import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FileUploadEvent}
  from '../file-upload/file-upload.component';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  template: 'avatar-upload.component.html',
})
export class AvatarUploadComponent {
  @Input() currentAvatarUrl?: string;
  @Input() altText = 'Avatar';

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
