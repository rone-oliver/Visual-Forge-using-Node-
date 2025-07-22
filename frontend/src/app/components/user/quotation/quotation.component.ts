import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { Router, RouterModule } from '@angular/router';
import { FileType, IQuotation, PaginatedQuotationsResponse, QuotationStatus } from '../../../interfaces/quotation.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FilesPreviewComponent } from '../files-preview/files-preview.component';
import { CompletedWork } from '../../../interfaces/completed-work.interface';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { RatingModalComponent } from '../../mat-dialogs/rating-modal/rating-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButton } from '@angular/material/button';
import { PaymentService } from '../../../services/payment.service';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IBid } from '../../../interfaces/bid.interface';
import { BidDialogComponent } from '../../mat-dialogs/bid-dialog/bid-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData, DialogType } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { TimelineChartComponent } from '../../shared/timeline-chart/timeline-chart.component';
import { FeedbackModalComponent } from '../../mat-dialogs/feedback-modal/feedback-modal.component';
import { PaymentType, WalletService } from '../../../services/user/wallet.service';
import { PaymentDialogComponent, PaymentMethod } from '../../mat-dialogs/payment-dialog/payment-dialog.component';

@Component({
  selector: 'app-quotation',
  imports: [
    CommonModule, FormsModule, MatIconModule, RouterModule,
    MatDialogModule, LocalDatePipe, MatButton, MatPaginatorModule,
    TimelineChartComponent,
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit, OnDestroy {
  loading = true;
  quotations: IQuotation[] = [];
  completedWorks: CompletedWork[] = [];
  completedWorksSearch = '';
  completedWorksLoading = false;
  FileType = FileType;
  activeFilter: QuotationStatus | 'All' = 'All';
  searchTerm = '';
  protected QuotationStatus = QuotationStatus;
  expandedWorkId: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10; // Default items per page
  totalItems = 0;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  bids: IBid[] = [];
  error: string | null = null;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private readonly walletService: WalletService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadQuotations();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadQuotations();
    });
  }

  loadQuotations(): void {
    this.loading = true;
    this.error = null;
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      status: this.activeFilter,
      searchTerm: this.searchTerm.trim()
    }
    this.userService.getQuotations(params).subscribe({
      next: (response: PaginatedQuotationsResponse) => {
        this.quotations = response.quotations;
        this.totalItems = response.totalItems;
        this.currentPage = response.currentPage;
        this.itemsPerPage = response.itemsPerPage;
        this.loading = false;
      },
      error: (err) => {
        console.error('error getting quotations', err);
        this.error = 'Failed to load quotations. Please try again.';
        this.loading = false;
      }
    })
  }

  viewBids(quotation: IQuotation): void {
    const dialogRef = this.dialog.open(BidDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { quotation }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.loadQuotations();
      }
    });
  }

  setFilter(filter: QuotationStatus | 'All'): void {
    this.completedWorksLoading = false;
    this.completedWorks.length = 0;
    this.quotations.length = 0;
    this.error = null;
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadQuotations();
  }

  onSearchTermChange(term: string): void {
    this.searchSubject.next(term);
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadQuotations();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'accepted': return 'status-accepted';
      case 'expired': return 'status-expired';
      // case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-published';
    }
  }

  countFilesByType(quotation: IQuotation, fileType: FileType): number {
    if (!quotation.attachedFiles || quotation.attachedFiles.length === 0) {
      return 0;
    }
    return quotation.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(quotation: IQuotation, fileType: FileType): void {
    if (!quotation.attachedFiles || quotation.attachedFiles.length === 0) {
      return;
    }

    const files = quotation.attachedFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  showCompletedWorks() {
    this.activeFilter = QuotationStatus.COMPLETED;
    this.loading = false;
    this.error = null;
    this.completedWorksLoading = true;
    this.currentPage = 1;
    this.loadCompletedWorks();
  }

  loadCompletedWorks(): void {
    this.userService.getCompletedWorks().subscribe({
      next: (works) => {
        console.log('Completed works: ', works);
        this.completedWorks = works;
        this.completedWorksLoading = false;
      },
      error: (err) => {
        console.error('Error fetching completed works: ', err);
        this.completedWorksLoading = false;
      }
    });
  }

  toggleTimeline(workId: string): void {
    this.expandedWorkId = this.expandedWorkId === workId ? null : workId;
  }

  openFeedbackModal(workId: string): void {
    const dialogRef = this.dialog.open(FeedbackModalComponent, {
      width: '500px',
      data: { workId },
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.feedback) {
        this.userService.submitWorkFeedback(workId, result.feedback).subscribe({
          next: () => {
            this.snackBar.open('Feedback submitted successfully!', 'Close', {
              duration: 3000,
              panelClass: 'success-snackbar'
            });
            this.loadCompletedWorks();
          },
          error: (err) => {
            console.error('Error submitting feedback:', err);
            this.snackBar.open('Failed to submit feedback. Please try again.', 'Close', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
          }
        });
      }
    });
  }

  countFinalFilesByType(work: CompletedWork, fileType: FileType): number {
    if (!work.finalFiles) return 0;
    return work.finalFiles.filter(file => file.fileType === fileType).length;
  }

  openFinalFilesModal(work: CompletedWork, fileType: FileType): void {
    if (!work.finalFiles || work.finalFiles.length === 0) {
      return;
    }

    const files = work.finalFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  countAttachedFilesByType(work: CompletedWork, fileType: FileType): number {
    if (!work.attachedFiles) return 0;
    return work.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openAttachedFileModal(work: CompletedWork, fileType: FileType): void {
    if (!work.attachedFiles || work.attachedFiles.length === 0) {
      return;
    }

    const files = work.attachedFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      data: { files, title: 'Client Files' }
    });
  }

  openEditorRatingModal(work: CompletedWork): void {
    this.userService.getCurrentEditorRating(work.editorId).subscribe({
      next: (rating) => {
        console.log('Current editor rating: ', rating);
        const dialogRef = this.dialog.open(RatingModalComponent, {
          width: '400px',
          data: {
            title: 'Rate the Editor',
            label: 'How would you rate the editor?',
            submitText: rating ? 'Update Rating' : 'Submit Rating',
            currentRating: rating?.rating ?? null,
            currentFeedback: rating?.feedback ?? ''
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log(result);
            this.userService.rateEditor(work.editorId, result.rating, result.feedback).subscribe({
              next: () => {
                console.log('Editor rated successfully');
                this.loadCompletedWorks();
              },
              error: (err) => {
                console.error('Error rating editor: ', err);
              }
            })
          }
        });
      },
      error: (err) => {
        console.error('Error fetching current editor rating: ', err);
        const dialogRef = this.dialog.open(RatingModalComponent, {
          width: '400px',
          data: {
            title: 'Rate the Editor',
            label: 'How would you rate the editor?',
            submitText: 'Submit Rating'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log(result);
            this.userService.rateEditor(work.editorId, result.rating, result.feedback).subscribe({
              next: () => {
                console.log('Editor rated successfully');
                this.loadCompletedWorks();
              },
              error: (err) => {
                console.error('Error rating editor: ', err);
              }
            })
          }
        });
      }
    })
  }

  markAsSatisfied(workId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Satisfaction',
        message: 'Are you sure you want to mark this work as satisfied? This indicates the project is complete and no further revisions are expected.',
        confirmText: 'Yes, I\'m Satisfied',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.markWorkAsSatisfied(workId).subscribe({
          next: () => {
            this.snackBar.open('Work marked as satisfied!', 'Dismiss', {
              duration: 3000,
              panelClass: 'success-snack',
            });
            this.loadCompletedWorks();
          },
          error: (err) => {
            console.error('Error marking work as satisfied:', err);
            this.snackBar.open(err.error?.message || 'Failed to mark work as satisfied.', 'Dismiss', {
              duration: 3000,
              panelClass: 'error-snack',
            });
          },
        });
      }
    });
  }

  openWorkRatingModal(work: CompletedWork): void {
    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '400px',
      data: {
        title: 'Rate This Work',
        label: 'How would you rate this work?',
        submitText: 'Submit Rating',
        currentRating: work.rating,
        currentFeedback: work.feedback
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        console.log('worksId:', work.worksId);
        this.userService.rateWork(work.worksId, result.rating, result.feedback).subscribe({
          next: () => {
            this.loadCompletedWorks();
          },
          error: (err) => {
            console.error('Error rating work: ', err);
          }
        })
      }
    });
  }

  togglePublicStatus(work: any) {
    const isMakingPublic = !work.isPublic;

    const dialogData: ConfirmationDialogData = {
      title: 'Confirm Action',
      message: `Are you sure you want to make this work ${isMakingPublic ? 'public' : 'private'}?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: isMakingPublic ? DialogType.INFO : DialogType.WARNING,
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateWorkPublicStatus(work.worksId, isMakingPublic).subscribe({
          next: () => {
            work.isPublic = isMakingPublic;
            this.snackBar.open(isMakingPublic ? 'Work made public' : 'Work set to private', 'Dismiss', {
              duration: 3000,
              panelClass: 'success-snackbar'
            });
          },
          error: (err) => {
            console.error('Error updating public status:', err);
            this.snackBar.open('Failed to update public status', 'Dismiss', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
          }
        });
      }
    })
  }

  async initiateAdvancePayment(quotation: IQuotation) {
    if (!quotation.advanceAmount) {
      console.error('Advance amount not specified');
      return;
    }
    this.openPaymentDialog(quotation, quotation.advanceAmount, PaymentType.ADVANCE);
  }

  async initiateBalancePayment(work: CompletedWork) {
    if (!work.balanceAmount) {
      console.error('Balance amount not specified');
      return;
    }
    this.openPaymentDialog(work, work.balanceAmount, PaymentType.BALANCE);
  }

  private openPaymentDialog(item: IQuotation | CompletedWork, amount: number, paymentType: PaymentType): void {
    const quotationId = '_id' in item ? item._id : item.quotationId;

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '600px',
      data: {
        amount,
        quotationId: quotationId,
        paymentType
      },
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.paymentMethod === PaymentMethod.WALLET) {
        this.handleWalletPayment(quotationId, amount, paymentType);
      } else if (result.paymentMethod === PaymentMethod.Razorpay) {
        this.handleRazorpayPayment(item, amount, paymentType);
      }
    });
  }

  private handleWalletPayment(quotationId: string, amount: number, paymentType: PaymentType): void {
    this.walletService.payWithWallet({ quotationId, amount, paymentType }).subscribe({
      next: () => {
        this.snackBar.open('Payment successful!', 'Dismiss', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.refreshData();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Payment failed. Please try again.', 'Dismiss', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private async handleRazorpayPayment(item: IQuotation | CompletedWork, amount: number, paymentType: PaymentType): Promise<void> {
    try {
      const quotationId = '_id' in item ? item._id : item.quotationId;
      const isAdvance = paymentType === PaymentType.ADVANCE;

      const paymentData = {
        amount: amount,
        currency: 'INR',
        quotationId: quotationId,
      };

      const order = await firstValueFrom(
        this.paymentService.createOrder(paymentData.amount, paymentData.currency, paymentData.quotationId)
      );

      const paymentResult = await this.paymentService.openRazorpayCheckout(order);

      await firstValueFrom(
        this.userService.updateQuotationPayment(isAdvance, quotationId, paymentData.amount, paymentResult)
      );

      this.snackBar.open('Payment successful!', 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
      this.refreshData();
    } catch (error) {
      console.error('Razorpay Payment process failed:', error);
      this.snackBar.open('Razorpay Payment process failed', 'Dismiss', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
    }
  }

  private refreshData(): void {
    if (this.activeFilter === QuotationStatus.COMPLETED) {
      this.loadCompletedWorks();
    } else {
      this.loadQuotations();
    }
  }

  editQuotation(quotation: IQuotation, event?: MouseEvent) {
    event?.stopPropagation();

    if (quotation.status === 'Published' || quotation.status === 'Cancelled') {
      this.router.navigate(['/user/edit-quotation', quotation._id]);
    } else {
      this.snackBar.open('Cannot edit quotations that are already accepted or in progress', 'Dismiss', {
        duration: 3000,
        panelClass: 'warning-snack'
      });
    }
  }

  deleteQuotation(quotation: IQuotation, event?: MouseEvent): void {
    event?.stopPropagation();

    if (quotation.status === 'Published' || quotation.status === 'Cancelled' || quotation.status === 'Expired') {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Confirm Deletion',
          message: 'Are you sure you want to delete this quotation?',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Call API to delete quotation
          this.userService.deleteQuotation(quotation._id).subscribe({
            next: () => {
              this.snackBar.open('Quotation deleted successfully', 'Dismiss', {
                duration: 3000,
                panelClass: 'success-snack'
              });
              // Refresh quotations list
              this.loadQuotations();
            },
            error: (err) => {
              console.error('Error deleting quotation:', err);
              this.snackBar.open('Failed to delete quotation', 'Dismiss', {
                duration: 3000,
                panelClass: 'error-snack'
              });
            }
          });
        }
      });
    } else {
      this.snackBar.open('Cannot delete quotations that are already accepted or in progress', 'Dismiss', {
        duration: 3000,
        panelClass: 'warning-snack'
      });
    }
  }

  openCancelBidConfirmation(quotation: IQuotation): void {
    if (!quotation.editorId) {
      this.snackBar.open('No editor ID found for this quotation.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.userService.getAcceptedBid(quotation._id, quotation.editorId).subscribe({
      next: (acceptedBid) => {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '400px',
          data: {
            title: 'Confirm Cancellation',
            message: 'Are you sure you want to cancel this agreement? This action cannot be undone.',
            type: DialogType.DANGER,
            confirmText: 'Yes, Cancel',
            cancelText: 'No, Keep it'
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.userService.cancelAcceptedBid(acceptedBid._id).subscribe({
              next: () => {
                this.snackBar.open('Agreement cancelled successfully.', 'Dismiss', {
                  duration: 3000,
                  panelClass: 'success-snack'
                });
                this.loadQuotations();
              },
              error: (err) => {
                console.error('Error cancelling bid:', err);
                this.snackBar.open(err.error.message || 'Failed to cancel agreement.', 'Dismiss', {
                  duration: 3000,
                  panelClass: 'error-snack'
                });
              }
            });
          }
        });
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Failed to find an accepted bid.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
