import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { FileAttachmentResponse, FileType, IQuotation } from '../../../interfaces/quotation.interface';
import { EditorService } from '../../../services/editor/editor.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';


@Component({
  selector: 'app-accepted-quotation',
  imports: [CommonModule,FormsModule,MatIconModule,LocalDatePipe,MatFormFieldModule,MatButtonModule,MatInputModule,MatRippleModule],
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

  constructor(
    private editorService: EditorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ){};

  ngOnInit(): void{
    this.loadAcceptedQuotations();
  }
  
  loadAcceptedQuotations(): void{
    this.isLoading = true;
    this.editorService.getAcceptedQuotations().subscribe({
      next: (quotations) => {
        this.acceptedQuotations = quotations;
        this.isLoading = false;

        if(this.acceptedQuotations.length > 0 && !this.selectedQuotation){
          this.selectedQuotation = this.acceptedQuotations[0];
        }
      },
      error: (error) => {
        console.error('Error loading accepted quotations', error);
        this.isLoading = false;
      }
    })
  }

  selectQuotation(quotation: IQuotation): void {
    this.selectedQuotation = quotation;
    this.responseText = '';
  }

  get filteredQuotations(): IQuotation[]{
    if(!this.searchQuery.trim()){
      return this.acceptedQuotations;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.acceptedQuotations.filter(q =>
      q.title?.toLowerCase().includes(query) || 
      q.description?.toLowerCase().includes(query)
    );
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
      userId: this.selectedQuotation.userId,
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
        this.uploadedFiles = [...this.uploadedFiles,...results];
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

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['custom-snackbar']
    });
  }

  viewWorksHistory(){
    console.log('Navigating to works history page');
    this.router.navigate(['/editor/works/history'])
  }
}
