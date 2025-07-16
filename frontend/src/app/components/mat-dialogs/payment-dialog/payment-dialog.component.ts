import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WalletService, Wallet, PaymentType } from '../../../services/user/wallet.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';

export interface PaymentDialogData {
  amount: number;
  quotationId: string;
  paymentType: PaymentType;
}

export enum PaymentMethod {
  WALLET = 'wallet',
  Razorpay = 'razorpay'
}

@Component({
  selector: 'app-payment-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss'
})
export class PaymentDialogComponent implements OnInit {
  private walletService = inject(WalletService);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  
  wallet: Wallet | null = null;
  isLoading = true;
  error: string | null = null;
  isSufficientBalance = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PaymentDialogData) {}

  ngOnInit(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.isSufficientBalance = wallet.balance >= this.data.amount;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load wallet information.';
        this.isLoading = false;
      }
    });
  }

  onWalletPay(): void {
    if (!this.isSufficientBalance) return;
    this.dialogRef.close({ paymentMethod: PaymentMethod.WALLET });
  }

  onRazorpayPay(): void {
    this.dialogRef.close({ paymentMethod: PaymentMethod.Razorpay });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
