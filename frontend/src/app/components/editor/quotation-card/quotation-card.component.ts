import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FileType, IQuotation, IQuotationWithEditorBid } from '../../../interfaces/quotation.interface';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { FormsModule } from '@angular/forms';
import { EditorService } from '../../../services/editor/editor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IBid, BidStatus, IEditorBidDetails } from '../../../interfaces/bid.interface';
import { ConfirmationDialogComponent, DialogType } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-quotation-card',
  imports: [MatTooltipModule, CommonModule, FormsModule, LocalDatePipe, MatIconModule, MatDialogModule, MediaProtectionDirective],
  templateUrl: './quotation-card.component.html',
  styleUrl: './quotation-card.component.scss'
})
export class QuotationCardComponent implements OnInit {
  @Input() quotation!: IQuotationWithEditorBid;
  @Output() bidActionCompleted = new EventEmitter<void>();

  FileType = FileType;
  bidAmount: number | null = null;
  bidNotes: string = '';

  isEditMode: boolean = false;

  constructor(
    private dialog: MatDialog,
    private editorService: EditorService,
    private snackBar: MatSnackBar,
  ) { }

  get currentEditorBid(): IEditorBidDetails | undefined {
    return this.quotation?.editorBid ? this.quotation.editorBid : undefined;
  }

  get hasActiveBid(): boolean {
    return !!this.quotation?.editorBid?.bidId;
  }

  ngOnInit(): void {
    this.isEditMode = false;
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

  submitNewBid(): void {
    if (!this.quotation._id || !this.bidAmount) {
      this.snackBar.open('Please enter a valid bid amount', 'Close', {
        duration: 3000,
        panelClass: ['custom-snackbar']
      });
      return;
    }

    this.editorService.createBid(
      this.quotation._id,
      this.bidAmount,
      this.bidNotes
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Bid submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.bidActionCompleted.emit();
        this.bidAmount = null;
        this.bidNotes = '';
        this.isEditMode = false;
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

  enterEditMode(): void {
    if (!this.currentEditorBid?.bidId) return;

    this.isEditMode = true;
    this.bidAmount = this.currentEditorBid.bidAmount || null;
    this.bidNotes = this.currentEditorBid.bidNotes || '';

    this.snackBar.open('You can now edit your bid', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  cancelEditMode(): void {
    this.isEditMode = false;
    this.bidAmount = null;
    this.bidNotes = '';
    this.snackBar.open('Bid editing cancelled.', 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  updateBid(): void {
    if (!this.currentEditorBid?.bidId || !this.bidAmount) {
      this.snackBar.open('Bid amount cannot be empty for an update.', 'Close', {
        duration: 3000,
        panelClass: ['custom-snackbar']
      });
      return;
    }

    this.editorService.updateBid(
      this.currentEditorBid.bidId,
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
        this.bidActionCompleted.emit();
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

  deleteUserBid(): void {
    if (!this.currentEditorBid?.bidId) {
      console.error('No bid to delete or bidId is missing.');
      this.snackBar.open('Could not identify the bid to delete.', 'Close', { duration: 3000, panelClass: ['custom-snackbar'] });
      return;
    }
    const bidIdToDelete = this.currentEditorBid.bidId;

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
        this.editorService.deleteBid(bidIdToDelete).subscribe({
          next: () => {
            this.snackBar.open('Bid deleted successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.isEditMode = false;
            this.bidAmount = null;
            this.bidNotes = '';
            this.bidActionCompleted.emit();
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

  getBidStatusClass(status: BidStatus | undefined): string {
    if (status === undefined) return 'status-unknown';
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
