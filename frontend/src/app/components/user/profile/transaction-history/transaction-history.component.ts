import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../services/user/user.service';
import { Transaction } from '../../../../interfaces/transaction.interface';
import { LocalDatePipe } from '../../../../pipes/date.pipe';

@Component({
  selector: 'app-transaction-history',
  imports: [
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    CurrencyPipe, LocalDatePipe, TitleCasePipe
  ],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactions: Transaction[] = [];
  totalItems:number = 0;
  currentPage:number = 1;
  itemsPerPage:number = 10;
  loading:boolean = true;
  error:string | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;
    this.userService.getTransactionHistory(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.transactions = response.transactions;
        this.totalItems = response.totalItems;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load transaction history.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadTransactions();
  }
}
