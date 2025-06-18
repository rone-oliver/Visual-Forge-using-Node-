import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-reports-resolution',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './reports-resolution.component.html',
  styleUrl: './reports-resolution.component.scss'
})
export class ReportsResolutionComponent {
  resolutionText = '';

  constructor(
    public dialogRef: MatDialogRef<ReportsResolutionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { report: Report }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}
