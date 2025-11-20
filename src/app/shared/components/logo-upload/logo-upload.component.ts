import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FileUploadEvent}
  from '../file-upload/file-upload.component';

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule],
  template: 'logo-upload.component.html',
})
export class LogoUploadComponent {
  @Input() currentLogoUrl?: string;
  @Input() altText = 'Logo';
  @Input() showRemoveOption = true;

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
