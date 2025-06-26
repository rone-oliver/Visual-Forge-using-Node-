import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-files-preview-modal',
  imports: [MatDialogModule,MatIconModule],
  templateUrl: './files-preview-modal.component.html',
  styleUrl: './files-preview-modal.component.scss'
})
export class FilePreviewModalComponent implements OnDestroy {
  previewUrl: SafeUrl;
  fileType: string;
  fileName: string;

  constructor(
    public dialogRef: MatDialogRef<FilePreviewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { file: File },
    private sanitizer: DomSanitizer
  ) {
    this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(data.file)
    );
    this.fileType = data.file.type.split('/')[0];
    this.fileName = data.file.name;
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      const url = this.sanitizer.sanitize(4, this.previewUrl) as string;
      URL.revokeObjectURL(url);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}