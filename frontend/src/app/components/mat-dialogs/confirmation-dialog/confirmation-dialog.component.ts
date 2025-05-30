import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export enum DialogType {
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  SUCCESS = 'success'
}

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  icon?: string;
  type?: DialogType;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Set defaults if not provided
    this.data.type = this.data.type || DialogType.WARNING;
    this.data.icon = this.data.icon || this.getDefaultIcon();
    this.data.confirmText = this.data.confirmText || 'Confirm';
    this.data.cancelText = this.data.cancelText || 'Cancel';
  }

  getDefaultIcon(): string {
    switch (this.data.type) {
      case DialogType.DANGER:
        return 'error_outline';
      case DialogType.SUCCESS:
        return 'check_circle_outline';
      case DialogType.INFO:
        return 'info_outline';
      case DialogType.WARNING:
      default:
        return 'warning_amber';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
