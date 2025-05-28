import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileType, IQuotation } from '../../../interfaces/quotation.interface';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { FormsModule } from '@angular/forms';
import { EditorService } from '../../../services/editor/editor.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-quotation-card',
  imports: [CommonModule, FormsModule, LocalDatePipe, MatIconModule, MatDialogModule],
  templateUrl: './quotation-card.component.html',
  styleUrl: './quotation-card.component.scss'
})
export class QuotationCardComponent {
  @Input() quotation!: IQuotation;
  // @Output() quotationAccepted = new EventEmitter<IQuotation["_id"]>();
  @Output() bidSubmitted = new EventEmitter<string>();
  FileType = FileType;
  bidAmount: number | null = null;
  bidNotes: string = '';
  
  constructor(
    private dialog: MatDialog,
    private editorService: EditorService,
    private snackBar: MatSnackBar,
  ){};

  countFilesByType(fileType: FileType): number {
    if (!this.quotation.attachedFiles || this.quotation.attachedFiles.length === 0) {
      return 0;
    }
    return this.quotation.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(fileType: FileType): void {
    if (!this.quotation.attachedFiles || this.quotation.attachedFiles.length === 0) {
      return;
    }
    
    const files = this.quotation.attachedFiles.filter(file => file.fileType === fileType);
    
    if (files.length === 0) {
      return;
    }
    
    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog-container',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  submitBid(quotation: IQuotation){
    if (!quotation._id || !this.bidAmount) {
      this.snackBar.open('Please enter a valid bid amount', 'Close', { duration: 3000 });
      return;
    }
    
    this.editorService.createBid(
      quotation._id, 
      this.bidAmount, 
      this.bidNotes
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Bid submitted successfully!', 'Close', { duration: 3000 });
        this.bidSubmitted.emit(quotation._id);
        // Reset form
        this.bidAmount = null;
        this.bidNotes = '';
      },
      error: (error) => {
        console.error('Error submitting bid:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to submit bid. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  // delete bid pending
}
