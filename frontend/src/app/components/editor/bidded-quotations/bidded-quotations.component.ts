import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EditorService } from '../../../services/editor/editor.service';
import { BiddedQuotation, BidStatus, PaginatedBiddedQuotationsResponse } from '../../../interfaces/bid.interface';
import { Router } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { EditorBidDialogComponent } from '../../mat-dialogs/editor-bid-dialog/editor-bid-dialog.component';

@Component({
  selector: 'app-bidded-quotations',
  imports: [
    FormsModule,
    DatePipe,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    CurrencyPipe
  ],
  templateUrl: './bidded-quotations.component.html',
  styleUrl: './bidded-quotations.component.scss'
})
export class BiddedQuotationsComponent implements OnInit {
  biddedQuotations: BiddedQuotation[] = [];
  isLoading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filtering
  selectedStatus: BidStatus | 'All' = 'All';
  bidStatusOptions = Object.values(BidStatus);
  hideNonBiddable = false;
  protected BidStatus = BidStatus;

  constructor(
    private editorService: EditorService,
    private router: Router,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadBiddedQuotations();
  }

  loadBiddedQuotations(): void {
    this.isLoading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      status: this.selectedStatus === 'All' ? undefined : this.selectedStatus,
      hideNonBiddable: this.hideNonBiddable
    };

    this.editorService.getBiddedQuotations(params).subscribe({
      next: (response: PaginatedBiddedQuotationsResponse) => {
        this.biddedQuotations = response.data;
        this.totalItems = response.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching bidded quotations:', err);
        this.error = 'Failed to load your bidded quotations. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadBiddedQuotations();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadBiddedQuotations();
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadBiddedQuotations();
  }

  navigateToQuotation(quotationId: string): void {
    // Optional: Navigate to the quotation details page if it exists
    // this.router.navigate(['/quotations', quotationId]);
  }

  goBack(): void {
    this.router.navigate(['/editor/published-quotations']);
  }

  openEditBidDialog(quotationId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(EditorBidDialogComponent, {
      width: '600px',
      data: { quotationId },
      panelClass: 'profile-edit-dialog' 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBiddedQuotations();
      }
    });
  }
}
