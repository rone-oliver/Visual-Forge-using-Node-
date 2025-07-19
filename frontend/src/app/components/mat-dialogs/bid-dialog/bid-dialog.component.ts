import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { IBid, BidStatus } from '../../../interfaces/bid.interface';
import { IQuotation } from '../../../interfaces/quotation.interface';
import { UserService } from '../../../services/user/user.service';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

@Component({
  selector: 'app-bid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LocalDatePipe,
    MediaProtectionDirective
  ],
  templateUrl: './bid-dialog.component.html',
  styleUrls: ['./bid-dialog.component.scss']
})
export class BidDialogComponent implements OnInit {
  bids: IBid[] = [];
  loading = true;
  error: string | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<BidDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { quotation: IQuotation },
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadBids();
  }
  
  loadBids(): void {
    this.loading = true;
    this.userService.getBidsByQuotation(this.data.quotation._id).subscribe({
      next: (bids) => {
        this.bids = bids;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bids:', error);
        this.error = 'Failed to load bids';
        this.loading = false;
      }
    });
  }
  
  acceptBid(bidId: string): void {
    this.userService.acceptBid(bidId).subscribe({
      next: (response) => {
        this.snackBar.open('Bid accepted successfully!', 'Close', { duration: 3000 });
        // Close dialog and notify parent component to refresh data
        this.dialogRef.close({ success: true });
      },
      error: (error) => {
        console.error('Error accepting bid:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to accept bid. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }
  
  getStatusClass(status: BidStatus): string {
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
  
  close(): void {
    this.dialogRef.close();
  }
}