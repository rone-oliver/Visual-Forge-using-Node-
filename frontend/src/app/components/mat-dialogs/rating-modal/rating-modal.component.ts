import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RatingDialogData } from '../../../interfaces/rating-dialog-data.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-rating-modal',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
],
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss'
})
export class RatingModalComponent {
  rating: number;
  editorRating: number;
  feedback: string;

  constructor(
    public dialogRef: MatDialogRef<RatingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RatingDialogData
  ) {
    this.rating = data.currentRating || 0;
    this.feedback = data.currentFeedback || '';
    this.editorRating = data.editorRating || 0;
  }

  getRatingText(rating: number): string {
    const ratingTexts = [
      '',
      'Poor',
      'Fair',
      'Good',
      'Very Good',
      'Excellent'
    ];
    return ratingTexts[rating];
  }

  submit() {
    this.dialogRef.close({
      rating: this.rating,
      feedback: this.feedback.trim(),
      editorRating: this.editorRating,
    });
  }
}
