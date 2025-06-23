import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';


export interface WalletDialogData {
  type: 'add' | 'withdraw';
}

@Component({
  selector: 'app-wallet-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule
],
  templateUrl: './wallet-dialog.component.html',
  styleUrl: './wallet-dialog.component.scss'
})
export class WalletDialogComponent {
  form: FormGroup;
  title: string;
  actionText: string;
  quickAddAmounts = [250, 500, 750];

  constructor(
    public dialogRef: MatDialogRef<WalletDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WalletDialogData,
    private fb: FormBuilder
  ) {
    this.title = this.data.type === 'add' ? 'Add Money to Wallet' : 'Withdraw from Wallet';
    this.actionText = this.data.type === 'add' ? 'Add' : 'Withdraw';

    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    });
  }

  setAmount(amount: number): void {
    this.form.get('amount')?.setValue(amount);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.amount);
    }
  }
}
