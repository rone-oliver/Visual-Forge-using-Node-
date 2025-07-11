import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { FileAttachmentResponse, FileType, IQuotation, PaginatedEditorQuotationsResponse } from '../../../interfaces/quotation.interface';
import { EditorService } from '../../../services/editor/editor.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';
import { UserService } from '../../../services/user/user.service';
import { ConfirmationDialogComponent, DialogType } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-accepted-quotation',
  imports: [
    FormsModule,
    MatIconModule,
    LocalDatePipe,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MediaProtectionDirective,
    MatTooltipModule,
  ],
  templateUrl: './accepted-quotation.component.html',
  styleUrl: './accepted-quotation.component.scss'
})
export class AcceptedQuotationComponent {
  acceptedQuotations: IQuotation[] = [];
  selectedQuotation: IQuotation | null = null;
  searchQuery: string = '';
  isLoading: boolean = true;
  responseText: string = '';
  FileType = FileType;
  selectedFiles: File[] = [];
  uploadedFiles: FileAttachmentResponse[] = [];
  isUploading: boolean = false;
  maxFiles = 3;

  // Pagination
  itemsPerPage: number = 15;
  currentPage: number = 1;
  totalItems: number = 0;
  hasMore: boolean = false;
  isLoadingMore: boolean = false;

  // Search
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(
    private editorService: EditorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
  ) { };

  ngOnInit(): void {
    this.loadAcceptedQuotations();
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(searchValue => {
      this.searchQuery = searchValue;
      this.loadAcceptedQuotations();
    })
  }

  loadAcceptedQuotations(loadMore = false): void {
    if (loadMore) {
      this.isLoadingMore = true;
      this.currentPage++;
    } else {
      this.isLoading = true;
      this.currentPage = 1;
      this.acceptedQuotations.length = 0;
    }
    this.editorService.getAcceptedQuotations({
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchTerm: this.searchQuery.trim() || undefined,
    }).subscribe({
      next: (response: PaginatedEditorQuotationsResponse) => {
        if (loadMore) {
          this.acceptedQuotations.push(...response.quotations);
        } else {
          this.acceptedQuotations = response.quotations;
        }
        this.totalItems = response.totalItems;
        this.hasMore = this.acceptedQuotations.length < this.totalItems;
        this.isLoading = false;
        this.isLoadingMore = false;

        if (this.acceptedQuotations.length > 0 && !this.selectedQuotation) {
          this.selectedQuotation = this.acceptedQuotations[0];
        }
      },
      error: (error) => {
        console.error('Error loading accepted quotations', error);
        if (loadMore) {
          this.currentPage--;
          this.isLoadingMore = false;
        } else {
          this.isLoading = false;
        }
        this.showMessage('Failed to load accepted quotations');
      }
    })
  }

  loadMore(): void {
    this.loadAcceptedQuotations(true);
  }

  selectQuotation(quotation: IQuotation): void {
    this.selectedQuotation = quotation;
    this.responseText = '';
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  countFilesByType(fileType: FileType): number {
    if (!this.selectedQuotation?.attachedFiles) return 0;
    return this.selectedQuotation.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(fileType: FileType): void {
    if (!this.selectedQuotation?.attachedFiles || this.selectedQuotation.attachedFiles.length === 0) {
      return;
    }

    const files = this.selectedQuotation.attachedFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog-container',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  submitResponse(): void {
    if (!this.selectedQuotation || !this.selectedQuotation._id || !this.responseText.trim() || this.uploadedFiles.length === 0) {
      return;
    }
    console.log(`Submitting response for quotation ${this.selectedQuotation._id}:`, this.responseText);
    const workData = {
      quotationId: this.selectedQuotation._id,
      finalFiles: this.uploadedFiles,
      comments: this.responseText
    }
    this.editorService.submitQuotationResponse(workData).subscribe({
      next: (response) => {
        console.log('Quotation response submitted:', response);
        this.showMessage('Your edit has been submitted successfully');

        this.selectedQuotation = null;
        this.selectedFiles = [];
        this.uploadedFiles = [];
        this.responseText = '';

        this.loadAcceptedQuotations();
      },
      error: (error) => {
        console.error('Error submitting quotation response:', error);
        this.showMessage('Error submitting response. Please try again.');
      }
    });
  }

  onFileSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    if (this.selectedFiles.length + files.length > this.maxFiles) {
      this.showMessage(`You can only upload a maximum of ${this.maxFiles} files`);
      return;
    }
    const newFiles = Array.from(files as FileList) as File[];
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
  }

  removeFile(index: number) {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  uploadFinalFiles() {
    if (this.selectedFiles.length === 0) {
      this.showMessage('Please select files to upload');
      return;
    }

    if (!this.selectedQuotation || !this.selectedQuotation._id) {
      this.showMessage('No quotation selected');
      return;
    }

    this.isUploading = true;

    this.editorService.uploadWorkFiles(this.selectedFiles).subscribe({
      next: (results) => {
        this.uploadedFiles = [...this.uploadedFiles, ...results];
        this.selectedFiles = [];
        this.isUploading = false;
        this.showMessage('Files uploaded successfully');
      },
      error: (error) => {
        console.error('Error uploading files:', error);
        this.isUploading = false;
        this.showMessage('Error uploading files');
      }
    });
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
            if(this.selectedQuotation?.isAdvancePaid){
              this.editorService.cancelAcceptedBid(acceptedBid._id).subscribe({
                next: () => {
                  this.snackBar.open('Agreement cancelled successfully.', 'Dismiss', {
                    duration: 3000,
                    panelClass: 'success-snack'
                  });
                  this.selectedQuotation = null;
                  this.loadAcceptedQuotations();
                },
                error: (err) => {
                  console.error('Error cancelling bid:', err);
                  this.snackBar.open(err.error.message || 'Failed to cancel agreement.', 'Dismiss', {
                    duration: 3000,
                    panelClass: 'error-snack'
                  });
                }
              });
            } else {
            this.userService.cancelAcceptedBid(acceptedBid._id).subscribe({
              next: () => {
                this.snackBar.open('Agreement cancelled successfully.', 'Dismiss', {
                  duration: 3000,
                  panelClass: 'success-snack'
                });
                this.selectedQuotation = null;
                this.loadAcceptedQuotations();
              },
              error: (err) => {
                console.error('Error cancelling bid:', err);
                this.snackBar.open(err.error.message || 'Failed to cancel agreement.', 'Dismiss', {
                  duration: 3000,
                  panelClass: 'error-snack'
                });
              }
            })
            }
          }
        });
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Failed to find an accepted bid.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['custom-snackbar']
    });
  }

  viewWorksHistory() {
    console.log('Navigating to works history page');
    this.router.navigate(['/editor/works/history'])
  }
}
