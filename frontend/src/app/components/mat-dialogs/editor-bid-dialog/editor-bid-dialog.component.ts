import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { EditorService } from '../../../services/editor/editor.service';
import { EditorBid } from '../../../interfaces/bid.interface';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface DialogData {
  quotationId: string;
}

@Component({
  selector: 'app-editor-bid-dialog',
  templateUrl: './editor-bid-dialog.component.html',
  styleUrl: './editor-bid-dialog.component.scss',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class EditorBidDialogComponent implements OnInit {
  bidId!: string;
  bidAmount!: number;
  bidNotes!: string;
  isLoading = true;
  isUpdating = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditorBidDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private editorService: EditorService,
  ) {}

  ngOnInit(): void {
    this.loadBidDetails();
  }

  loadBidDetails(): void {
    this.isLoading = true;
    this.editorService.getEditorBidForQuotation(this.data.quotationId).subscribe({
      next: (bid: EditorBid) => {
        this.bidId = bid._id;
        this.bidAmount = bid.bidAmount;
        this.bidNotes = bid.bidNotes || '';
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load bid details. Please try again later.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateBid(): void {
    if (!this.bidId || this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    this.error = null;

    this.editorService.updateBid(this.bidId, this.bidAmount, this.bidNotes).subscribe({
      next: () => {
        this.isUpdating = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isUpdating = false;
        this.error = 'Failed to update bid. Please try again.';
        console.error('Failed to update bid', err);
      }
    });
  }
}
