import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { QuotationCardComponent } from '../quotation-card/quotation-card.component';
import { GetEditorQuotationsParams, IQuotation, IQuotationWithEditorBid, OutputType, PaginatedEditorQuotationsResponse } from '../../../interfaces/quotation.interface';
import { EditorService } from '../../../services/editor/editor.service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-quotation',
  imports: [
    CommonModule,
    QuotationCardComponent,
    MatIconModule,
    FormsModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit, OnDestroy {
  quotations: IQuotationWithEditorBid[] = [];
  protected OutputType = OutputType;
  protected activeFilter: OutputType | 'All' = 'All';
  selectedMediaType: OutputType = OutputType.MIXED;

  // Pagination
  currentPage =1;
  itemsPerPage = 10;
  totalItems = 0;

  // Search
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  // Loading and error
  isLoading = false;
  error: string | null = null;    

  constructor(
    private router: Router,
    private editorService:EditorService,
  ){};
  ngOnInit():void{
    this.loadQuotations();
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.currentPage = 1;
      this.searchTerm = searchValue;
      this.loadQuotations();
    })
  };

  loadQuotations(): void{
    this.isLoading = true;
    this.error = null;
    const params: GetEditorQuotationsParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      mediaType: this.selectedMediaType === OutputType.MIXED ? undefined : this.selectedMediaType,
      searchTerm: this.searchTerm.trim() || undefined,
    }

    this.editorService.getPublishedQuotations(params).subscribe({
      next: (response: PaginatedEditorQuotationsResponse) => {
        this.quotations = response.quotations;
        this.totalItems = response.totalItems;
        this.isLoading = false;

        console.log('Component State After Load:');
        console.log('totalItems:', this.totalItems);
        console.log('currentPage:', this.currentPage);
        console.log('itemsPerPage:', this.itemsPerPage);
      },
      error: (err) => {
        console.error('Error fetching published quotations:', err);
        this.error = 'Failed to load quotations. Please try again later.';
        this.isLoading = false;
      }
    })
  }

  onSearchTermChange(term: string): void {
    this.searchSubject.next(term);
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadQuotations();
  }

  navigateToBidded(): void {
    this.router.navigate(['/editor/bidded-quotations']);
  }

  navigateToAccepted(): void {
    this.router.navigate(['/editor/accepted-quotations']);
  }

  setMediaType(mediaType: OutputType){
    this.selectedMediaType = mediaType;

    if (mediaType === OutputType.MIXED) {
      this.activeFilter = 'All';
    } else {
      this.activeFilter = mediaType;
    }
    this.currentPage = 1;
    this.loadQuotations();
  }

  trackByQuotationId(index: number, quotation: IQuotationWithEditorBid): string {
    return quotation._id || String(index);
  }

  handleBidActionCompletion(): void {
    console.log('Bid action completed, reloading quotations...');
    this.loadQuotations();
  }

  ngOnDestroy(): void {
    if(this.searchSubscription){
      this.searchSubscription.unsubscribe();
    }
  }
}
