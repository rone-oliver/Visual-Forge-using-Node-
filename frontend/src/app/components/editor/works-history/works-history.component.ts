import { CommonModule } from '@angular/common';
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
import { CompletedWork } from '../../../interfaces/completed-word.interface';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-works-history',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatRippleModule,
    LocalDatePipe
  ],
  templateUrl: './works-history.component.html',
  styleUrl: './works-history.component.scss'
})
export class WorksHistoryComponent {
  completedWorks: CompletedWork[] = [];
  filteredWorks: CompletedWork[] = [];
  isLoading: boolean = true;
  searchQuery: string = '';
  FileType = FileType;

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
        fileType: fileType
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

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['custom-snackbar']
    });
  }
}
