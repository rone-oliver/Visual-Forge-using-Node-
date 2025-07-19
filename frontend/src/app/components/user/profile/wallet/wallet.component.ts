import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WalletDialogComponent } from '../../../mat-dialogs/wallet-dialog/wallet-dialog.component';
import { UserService } from '../../../../services/user/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IPaginatedResponse, IWalletTransaction } from '../../../../interfaces/wallet.interface';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent implements OnInit {
  currentBalance = 0;
  currency = 'INR';
  transactions: IWalletTransaction[] = [];
  isLoading = true;
  error: string | null = null;

  // Pagination
  page = 1;
  limit = 10;
  canLoadMore = true;

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadWalletDetails();
  }

  loadWalletDetails(): void {
    this.isLoading = true;
    this.error = null;
    this.userService.getWalletDetails().subscribe({
      next: (data) => {
        this.currentBalance = data.balance;
        this.currency = data.currency;
        this.loadTransactions(true);
      },
      error: (err) => {
        console.error('load wallet details error', err);
        this.error = 'Failed to load wallet details.';
        this.showErrorSnackbar(err.error?.message || 'Failed to load wallet details.', () => {
          this.loadWalletDetails();
        });
        this.isLoading = false;
      }
    });
  }

  loadTransactions(isInitialLoad = false): void {
    if (isInitialLoad) {
      this.page = 1;
      this.transactions = [];
      this.canLoadMore = true;
    }

    this.isLoading = true;
    this.userService.getWalletTransactions({ page: this.page, limit: this.limit }).subscribe({
      next: (response: IPaginatedResponse<IWalletTransaction>) => {
        this.transactions.push(...response.data);
        this.canLoadMore = response.page < response.totalPages;
        this.page++;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('load transactions error', err);
        this.error = 'Failed to load transactions.';
        this.showErrorSnackbar(err.error?.message || 'Failed to load transactions.', () => {
          this.loadTransactions();
        });
        this.isLoading = false;
      }
    });
  }

  openAddMoneyDialog(): void {
    const dialogRef = this.dialog.open(WalletDialogComponent, {
      width: '450px',
      data: { type: 'add', currency: this.currency },
      panelClass: 'profile-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const amount = parseFloat(result);
        this.userService.addMoneyToWallet(amount).subscribe({
          next: (res) => {
            this.currentBalance = res.balance;
            this.loadTransactions(true); // Refresh transactions
          },
          error: (err) => {
            console.error('add money error', err);
            this.showErrorSnackbar(err.error?.message || 'Failed to add money.');
          }
        });
      }
    });
  }

  openWithdrawDialog(): void {
    const dialogRef = this.dialog.open(WalletDialogComponent, {
      width: '450px',
      data: { type: 'withdraw', currency: this.currency },
      panelClass: 'profile-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const amount = parseFloat(result);
        this.userService.withdrawMoneyFromWallet(amount).subscribe({
          next: (res) => {
            this.currentBalance = res.balance;
            this.loadTransactions(true); // Refresh transactions
          },
          error: (err) => {
            console.error('withdraw money error', err);
            this.showErrorSnackbar(err.error?.message || 'Failed to withdraw money.')
          }
        });
      }
    });
  }

  private showErrorSnackbar(message: string, actionCallback?: () => void): void {
    const snackBarRef = this.snackBar.open(message, actionCallback ? 'Retry' : 'Close', {
      duration: 5000,
      panelClass: ['custom-snackbar'],
      verticalPosition: 'bottom',
      horizontalPosition:'center',
    });

    if (actionCallback) {
      snackBarRef.onAction().subscribe(() => {
        actionCallback();
      });
    }
  }
}
