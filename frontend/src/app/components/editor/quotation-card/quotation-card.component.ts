import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FileType, IQuotation } from '../../../interfaces/quotation.interface';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { FormsModule } from '@angular/forms';
import { EditorService } from '../../../services/editor/editor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IBid, BidStatus } from '../../../interfaces/bid.interface';
import { ConfirmationDialogComponent, DialogType } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-quotation-card',
  imports: [CommonModule, FormsModule, LocalDatePipe, MatIconModule, MatDialogModule],
  templateUrl: './quotation-card.component.html',
  styleUrl: './quotation-card.component.scss'
})
export class QuotationCardComponent implements OnInit {
  @Input() quotation!: IQuotation;
  @Output() bidSubmitted = new EventEmitter<string>();
  @Output() bidDeleted = new EventEmitter<string>();
  
  FileType = FileType;
  bidAmount: number | null = null;
  bidNotes: string = '';
  
  hasBidForQuotation: boolean = false;
  existingBid: IBid | null = null;
  isEditMode: boolean = false;
  
  constructor(
    private dialog: MatDialog,
    private editorService: EditorService,
    private snackBar: MatSnackBar,
  ){}
  
  ngOnInit(): void {
    if (this.quotation._id) {
      this.checkExistingBid();
    }
  }
  
  checkExistingBid(): void {
    this.editorService.getEditorBids().subscribe({
      next: (bids) => {
        const existingBid = bids.find(bid => bid.quotationId === this.quotation._id);
        if (existingBid) {
          this.hasBidForQuotation = true;
          this.existingBid = existingBid;
        }
        console.log('bids: ',bids);
        console.log('quotation Id: ',this.quotation._id);
        console.log(`has existing bid for quotation ${this.quotation.title}`,existingBid);
      },
      error: (error) => {
        console.error('Error checking existing bids:', error);
      }
    });
  }

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

  submitBid(quotation: IQuotation): void {
    if (!quotation._id || !this.bidAmount) {
      this.snackBar.open('Please enter a valid bid amount', 'Close', {
        duration: 3000,
        panelClass: ['custom-snackbar']
      });
      return;
    }
    
    if (this.isEditMode && this.existingBid) {
      this.updateBid();
      return;
    }
    
    this.editorService.createBid(
      quotation._id, 
      this.bidAmount, 
      this.bidNotes
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Bid submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.bidSubmitted.emit(quotation._id);
        // Reset form
        this.bidAmount = null;
        this.bidNotes = '';
        // Refresh bid status
        this.checkExistingBid();
      },
      error: (error) => {
        console.error('Error submitting bid:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to submit bid. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['custom-snackbar'] }
        );
      }
    });
  }
  
  editBid(): void {
    if (!this.existingBid) return;
    
    this.isEditMode = true;
    this.bidAmount = this.existingBid.bidAmount;
    this.bidNotes = this.existingBid.notes || '';
    
    // Temporarily set hasBidForQuotation to false to enable the form
    this.hasBidForQuotation = false;

    this.snackBar.open('You can now edit your bid', 'Close', { 
      duration: 3000,
      panelClass: ['custom-snackbar']
    });
  }
  
  updateBid(): void {
    if (!this.existingBid || !this.bidAmount) return;
    
    this.editorService.updateBid(
      this.existingBid._id,
      this.bidAmount,
      this.bidNotes
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Bid updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isEditMode = false;
        // Reset form
        this.bidAmount = null;
        this.bidNotes = '';
        // Refresh bid status
        this.checkExistingBid();
      },
      error: (error) => {
        console.error('Error updating bid:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to update bid. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['custom-snackbar'] }
        );
      }
    });
  }
  
  deleteBid(bidId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Bid',
        message: 'Are you sure you want to delete this bid? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: DialogType.DANGER,
        icon: 'delete_forever'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.editorService.deleteBid(bidId).subscribe({
          next: () => {
            this.snackBar.open('Bid deleted successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.hasBidForQuotation = false;
            this.existingBid = null;
            this.bidDeleted.emit(this.quotation._id);
          },
          error: (error) => {
            console.error('Error deleting bid:', error);
            this.snackBar.open(
              error.error?.message || 'Failed to delete bid. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['custom-snackbar'] }
            );
          }
        });
      }
    });
  }
  
  getBidStatusClass(status: BidStatus): string {
    switch (status) {
      case BidStatus.ACCEPTED:
        return 'status-accepted';
      case BidStatus.REJECTED:
        return 'status-rejected';
      case BidStatus.EXPIRED:
        return 'status-expired';
      default:
        return 'status-pending';
    }
  }
}
