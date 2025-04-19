import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FileAttachmentResponse } from '../../../interfaces/quotation.interface';

@Component({
  selector: 'app-files-preview',
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './files-preview.component.html',
  styleUrl: './files-preview.component.scss'
})
export class FilesPreviewComponent {
  constructor(
    public dialogRef: MatDialogRef<FilesPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { files: FileAttachmentResponse[]; fileType: string },
  ){}

  close() {
    this.dialogRef.close();
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
