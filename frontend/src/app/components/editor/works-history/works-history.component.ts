import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditorService } from '../../../services/editor/editor.service';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { FileType } from '../../../interfaces/quotation.interface';
import { CompletedWork } from '../../../interfaces/completed-work.interface';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { MatDialog } from '@angular/material/dialog';
import { ReplaceFilesDialogComponent } from '../../mat-dialogs/replace-files-dialog/replace-files-dialog.component';
import { TimelineChartComponent } from '../../shared/timeline-chart/timeline-chart.component';

@Component({
  selector: 'app-works-history',
  imports: [
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatRippleModule,
    LocalDatePipe,
    TimelineChartComponent,
  ],
  templateUrl: './works-history.component.html',
  styleUrl: './works-history.component.scss'
})
export class WorksHistoryComponent implements OnInit {
  completedWorks: CompletedWork[] = [];
  filteredWorks: CompletedWork[] = [];
  isLoading = true;
  searchQuery = '';
  FileType = FileType;
  expandedWorkId: string | null = null;

  constructor(
    private editorService: EditorService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadCompletedWorks();
  }

  loadCompletedWorks(): void {
    this.isLoading = true;
    this.editorService.getCompletedWorks().subscribe({
      next: (works) => {
        this.completedWorks = works;
        this.filteredWorks = works;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading completed works:', error);
        this.isLoading = false;
        this.showMessage('Error loading work history');
      }
    });
  }

  searchWorks(): void {
    if (!this.searchQuery.trim()) {
      this.filteredWorks = this.completedWorks;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredWorks = this.completedWorks.filter(work =>
      work.title?.toLowerCase().includes(query) ||
      work.description?.toLowerCase().includes(query) ||
      work.comments?.toLowerCase().includes(query)
    );
  }

  toggleTimeline(workId: string): void {
    this.expandedWorkId = this.expandedWorkId === workId ? null : workId;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredWorks = this.completedWorks;
  }

  countFilesByType(work: CompletedWork, fileType: FileType): number {
    if (!work.finalFiles) return 0;
    return work.finalFiles.filter(file => file.fileType === fileType).length;
  }

  countAttachedFilesByType(work: CompletedWork, fileType: FileType): number {
    if (!work.attachedFiles) return 0;
    return work.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(work: CompletedWork, fileType: FileType): void {
    if (!work.finalFiles || work.finalFiles.length === 0) {
      return;
    }

    const files = work.finalFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        files,
        fileType: fileType,
      }
    });
  }

  openAttachedFileModal(work: CompletedWork, fileType: FileType): void {
    if (!work.attachedFiles || work.attachedFiles.length === 0) {
      return;
    }

    const files = work.attachedFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      data: { files, title: 'Client Files' }
    });
  }

  openAddFilesDialog(work: CompletedWork): void {
    const dialogRef = this.dialog.open(ReplaceFilesDialogComponent, {
      width: '600px',
      data: { work, mode: 'add' },
      panelClass: 'modern-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.filesToAdd.length > 0) {
        this.editorService.updateWorkFiles(work.worksId, result.filesToAdd, []).subscribe({
          next: () => {
            this.showMessage('Files added successfully');
            this.loadCompletedWorks();
          },
          error: (error) => {
            console.error('Error adding files:', error);
            this.showMessage('Error adding files');
          }
        });
      }
    });
  }

  openReplaceFilesDialog(work: CompletedWork): void {
    const dialogRef = this.dialog.open(ReplaceFilesDialogComponent, {
      width: '600px',
      data: { work, mode: 'replace' },
      panelClass: 'modern-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.editorService.updateWorkFiles(work.worksId, result.filesToAdd, result.idsToDelete).subscribe({
          next: () => {
            this.showMessage('Files updated successfully');
            this.loadCompletedWorks();
          },
          error: (error) => {
            console.error('Error updating files:', error);
            this.showMessage('Error updating files');
          }
        });
      }
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['custom-snackbar']
    });
  }
}
