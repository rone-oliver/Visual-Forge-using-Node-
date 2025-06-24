import { Component, OnInit, signal, ChangeDetectionStrategy, ViewChild, AfterViewInit, viewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LedgerService } from '../../../services/admin/ledger.service';
import { AdminTransaction, TransactionFlow } from '../../../interfaces/admin-ledger.interface';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ledger',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-in')]),
      transition(':leave', [animate('300ms ease-out', style({ opacity: 0 }))]),
    ]),
  ]
})
export class LedgerComponent implements OnInit, AfterViewInit {
  isLoading = signal(true);
  transactions = signal<AdminTransaction[]>([]);
  totalBalance = signal<number>(0);
  
  dataSource = new MatTableDataSource<AdminTransaction>([]);
  displayedColumns: string[] = ['createdAt', 'transactionType', 'flow', 'amount', 'commission', 'details'];
  
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  // Pagination
  totalItems = 0;
  itemsPerPage = 10;
  currentPage = 1;

  constructor(
    private ledgerService: LedgerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchLedger();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.sortingDataAccessor = (item: AdminTransaction, property: string) => {
      switch (property) {
        case 'createdAt':
          return new Date(item.createdAt).getTime();
        case 'amount':
        case 'commission':
          return item[property]; // These are numbers
        case 'transactionType':
        case 'flow':
          return item[property]; // These are strings
        default:
          return ''; // Return a default value for non-sortable columns
      }
    };
  }

  fetchLedger(): void {
    this.isLoading.set(true);
    this.ledgerService.getLedger(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.dataSource.data = response.transactions;
        this.totalItems = response.totalItems;
        this.totalBalance.set(response.totalBalance);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch ledger data:', err);
        this.isLoading.set(false);
        this.snackBar.open('Failed to fetch ledger data', 'Close', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['custom-snackbar'],
        });
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.itemsPerPage = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchLedger();
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
