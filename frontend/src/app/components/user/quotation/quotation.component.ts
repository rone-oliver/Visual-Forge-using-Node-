import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { Router, RouterModule } from '@angular/router';
import { FileAttachment, FileType, IPaymentVerification, IQuotation } from '../../../interfaces/quotation.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FilesPreviewComponent } from '../files-preview/files-preview.component';
import { CompletedWork } from '../../../interfaces/completed-word.interface';
import { DatePipe, LocalDatePipe } from '../../../pipes/date.pipe';
import { RatingModalComponent } from '../../mat-dialogs/rating-modal/rating-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButton } from '@angular/material/button';
import { PaymentService } from '../../../services/payment.service';
import { firstValueFrom } from 'rxjs';
import { IBid } from '../../../interfaces/bid.interface';
import { BidDialogComponent } from '../../mat-dialogs/bid-dialog/bid-dialog.component';
import { ConfirmationDialogComponent } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-quotation',
  imports: [CommonModule, MatIconModule, RouterModule, MatDialogModule, LocalDatePipe, MatButton],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  loading: boolean = true;
  quotations: IQuotation[] = [];
  completedWorks: CompletedWork[] = [];
  completedWorksSearch: string = '';
  completedWorksLoading: boolean = false;
  FileType = FileType;
  activeFilter: 'All' | 'Accepted' | 'Published' | 'Completed' | 'Expired' | 'Cancelled' = 'All';
  bids: IBid[] = [];
  error: string | null = null;
  quotationBidCounts: { [key: string]: number } = {};

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadQuotations();
    this.loadAllBidCounts();
  }

  loadQuotations(): void {
    this.userService.getQuotations().subscribe({
      next: (quotations) => {
        this.quotations = quotations;
        this.loading = false;
        this.loadAllBidCounts();
      },
      error: (err) => {
        console.error('error getting quotations', err);
        this.loading = false;
      }
    })
  }

  loadAllBidCounts(): void {
    const publishedQuotations = this.quotations.filter(q => q.status === 'Published');

    publishedQuotations.forEach(quotation => {
      this.userService.getBidCountsForUserQuotations().subscribe({
        next: (bidCounts) => {
          this.quotationBidCounts = bidCounts;
        },
        error: (error) => {
          console.error(`Error loading bids for quotation ${quotation._id}:`, error);
        }
      });
    });
  }

  viewBids(quotation: IQuotation): void {
    const dialogRef = this.dialog.open(BidDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { quotation }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Refresh quotations and bid counts if a bid was accepted
        this.loadQuotations();
      }
    });
  }

  setFilter(filter: 'All' | 'Accepted' | 'Published' | 'Expired' | 'Cancelled'): void {
    this.activeFilter = filter;
  }

  get filteredQuotations(): IQuotation[] {
    if (this.activeFilter === 'All') {
      return this.quotations;
    }
    return this.quotations.filter(q => q.status === this.activeFilter);
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
    this.activeFilter = 'Completed';
    this.completedWorksLoading = true;
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
    const isPublic = !work.isPublic;
    this.userService.updateWorkPublicStatus(work.worksId, isPublic).subscribe({
      next: () => {
        work.isPublic = isPublic;
        this.snackBar.open(isPublic ? 'Work made public' : 'Work set to private', 'Dismiss', {
          duration: 3000,
          panelClass: isPublic ? 'success-snackbar' : 'custom-snackbar'
        });
      },
      error: (err) => {
        console.error('Error updating public status:', err);
        this.snackBar.open('Failed to update public status', 'Dismiss', {
          duration: 3000,
          panelClass: 'custom-snackbar'
        });
      }
    });
  }

  async initiateAdvancePayment(quotation: IQuotation) {
    try {
      const order = await firstValueFrom(
        this.paymentService.createOrder(quotation.estimatedBudget, 'INR')
      );

      const paymentResult = await this.paymentService.openRazorpayCheckout(order);
      console.log('paymentResult from component: ', paymentResult);

      // After successful payment and verification
      await firstValueFrom(
        this.userService.updateQuotationPayment(true, quotation._id, quotation.estimatedBudget, paymentResult)
      );

      this.snackBar.open('Payment successful!', 'Close', {
        duration: 3000,
        panelClass: 'success-snack'
      });

      // Refresh quotations list
      this.loadQuotations();

    } catch (error) {
      console.error('Payment or update failed:', error);
      this.snackBar.open('Payment process failed', 'Dismiss', {
        duration: 3000,
        panelClass: 'error-snack'
      });
    }
  }

  async initiateBalancePayment(work: CompletedWork) {
    try {
      const order = await firstValueFrom(
        this.paymentService.createOrder(work.estimatedBudget, 'INR')
      );

      const paymentResult = await this.paymentService.openRazorpayCheckout(order);
      console.log('paymentResult from component: ', paymentResult);

      // After successful payment and verification
      await firstValueFrom(
        this.userService.updateQuotationPayment(false, work.quotationId, work.estimatedBudget, paymentResult)
      );

      this.snackBar.open('Payment successful!', 'Close', {
        duration: 3000,
        panelClass: 'success-snack'
      });

      // Refresh completed quotations list
      this.loadCompletedWorks();

    } catch (error) {
      console.error('Payment or update failed:', error);
      this.snackBar.open('Payment process failed', 'Dismiss', {
        duration: 3000,
        panelClass: 'error-snack'
      });
    }
  }

  editQuotation(quotation: IQuotation, event?: MouseEvent) {
    event?.stopPropagation();

    // Navigate to edit page with the quotation ID
    // Only allow editing for quotations that are not yet accepted or in progress
    
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

    // Only allow deleting quotations that are not accepted or in progress
    if (quotation.status === 'Published' || quotation.status === 'Cancelled' || quotation.status === 'Expired') {
      // Show confirmation dialog
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
}
