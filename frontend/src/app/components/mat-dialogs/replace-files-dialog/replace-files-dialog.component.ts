import { Component, Inject, SecurityContext } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CompletedWork } from '../../../interfaces/completed-work.interface';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileAttachmentResponse, FileType } from '../../../interfaces/quotation.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CloudinaryUrlBuilder } from '../../../../utils/cloudinary/cloudinary-url';

export interface ReplaceFilesDialogData {
  work: CompletedWork;
  mode: 'add' | 'replace';
}

export interface ReplaceFilesDialogResult {
  filesToAdd: File[];
  idsToDelete: string[];
}

interface FilePreview {
  file: File;
  previewUrl: SafeUrl;
}

@Component({
  selector: 'app-replace-files-dialog',
  imports: [
    MatDialogModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './replace-files-dialog.component.html',
  styleUrl: './replace-files-dialog.component.scss',
})
export class ReplaceFilesDialogComponent {
  filesToAdd: FilePreview[] = [];
  idsToDelete = new Set<string>();
  FileType = FileType;

  readonly maxFiles = 3;
  remainingSlots = 0;

  constructor(
    public dialogRef: MatDialogRef<ReplaceFilesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReplaceFilesDialogData,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.calculateRemainingSlots();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files);

    if (newFiles.length > this.remainingSlots) {
      this.snackBar.open(`You can only add ${this.remainingSlots} more file(s).`, 'Close', { duration: 3000 });
    }

    const filesToProcess = newFiles.slice(0, this.remainingSlots);

    this.filesToAdd = filesToProcess.map(file => ({
      file,
      previewUrl: this.createPreviewUrl(file)
    }));

    input.value = '';
    this.calculateRemainingSlots();
  }

  createPreviewUrl(file: File): SafeUrl {
    const url = URL.createObjectURL(file);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getCompleteUrl(file: FileAttachmentResponse): string {
    if (file.url) {
      return file.url;
    }
    console.log('Url builder running...');
    const completeUrl = CloudinaryUrlBuilder.buildUrl({
      uniqueId: file.uniqueId,
      timestamp: file.timestamp,
      fileType: file.fileType,
    })
    return completeUrl;
  }

  toggleDelete(fileId: string): void {
    if (this.idsToDelete.has(fileId)) {
      this.idsToDelete.delete(fileId);
    } else {
      this.idsToDelete.add(fileId);
    }
    this.calculateRemainingSlots();
  }

  removeNewFile(fileToPreview: FilePreview): void {
    this.filesToAdd = this.filesToAdd.filter(p => p !== fileToPreview);
    this.calculateRemainingSlots();
  }

  private calculateRemainingSlots(): void {
    const currentFileCount = this.data.work.finalFiles.length;
    const newFileCount = this.filesToAdd.length;
    const deletedFileCount = this.idsToDelete.size;

    const effectiveCurrentCount = currentFileCount - deletedFileCount;
    this.remainingSlots = this.maxFiles - effectiveCurrentCount - newFileCount;
  }

  getFileType(file: FileAttachmentResponse): 'image' | 'video' | 'audio' | 'other' {
    if (file.mimeType.startsWith('image/')) return 'image';
    if (file.mimeType.startsWith('video/')) return 'video';
    if (file.mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  }

  getFileTypeForAddedFiles(file: File): 'image' | 'video' | 'audio' | 'other' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'other';
  }

  onConfirm(): void {
    const result: ReplaceFilesDialogResult = {
      filesToAdd: this.filesToAdd.map(p => p.file),
      idsToDelete: Array.from(this.idsToDelete),
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}