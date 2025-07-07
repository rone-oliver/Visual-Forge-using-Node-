import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FileAttachmentResponse } from '../../../interfaces/quotation.interface';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';
import { CloudinaryUrlBuilder } from '../../../../utils/cloudinary/cloudinary-url';

@Component({
  selector: 'app-files-preview',
  imports: [CommonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MediaProtectionDirective],
  templateUrl: './files-preview.component.html',
  styleUrl: './files-preview.component.scss'
})
export class FilesPreviewComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  downloadProgress: { [key:string]: number} = {};
  isDownloading: { [key: string]: boolean } = {};

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<FilesPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { files: FileAttachmentResponse[]; fileType: string },
  ) { }

  getCompleteUrl(file: FileAttachmentResponse): string {
    if(file.url){
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

  downloadFile(file: any): void {
    if (this.isDownloading[file.fileName]) return;
    
    this.isDownloading[file.fileName] = true;
    this.downloadProgress[file.fileName] = 0;
    const url = this.getCompleteUrl(file);
    

    this.http.get(url, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.DownloadProgress && event.total) {
          this.downloadProgress[file.fileName] = Math.round(100 * event.loaded / event.total);
        }
        if (event.type === HttpEventType.Response) {
          const blob = event.body;
          if (!blob) {
            console.error('No blob received');
            this.isDownloading[file.fileName] = false;
            return;
          }
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName || 'download';
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          this.isDownloading[file.fileName] = false;
        }
      },
      error: (error) => {
        console.error('Download error:', error);
        this.isDownloading[file.fileName] = false;
      },
      complete: () => {
        this.isDownloading[file.fileName] = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
