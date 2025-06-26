import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FileAttachmentResponse, IQuotation, OutputType } from '../../../interfaces/quotation.interface';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface FileWithProgress {
  file: File;
  progress: number;
}

@Component({
  selector: 'app-create-quotation',
  imports: [ReactiveFormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './create-quotation.component.html',
  styleUrl: './create-quotation.component.scss'
})
export class CreateQuotationComponent implements OnInit{
  quotationForm: FormGroup;
  outputTypes = Object.values(OutputType);
  selectedFiles: File[] = [];
  uploadedFiles: FileAttachmentResponse[] = [];
  isUploading: boolean = false;
  maxFiles = 5;
  // uploadProgress = 0;
  // uploadProgress: { [key: string]: number } = {};

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.quotationForm = this.fb.group({
      title: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      description: ['', Validators.required],
      theme: [''],
      dueDate: [tomorrow, Validators.required],
      estimatedBudget: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(0)]],
      outputType: ['', Validators.required],
      attachedFiles: [[]],
    });
  }

  // Getters for easy access from the template
  get title() { return this.quotationForm.get('title'); }
  get description() { return this.quotationForm.get('description'); }
  get dueDate() { return this.quotationForm.get('dueDate'); }
  get estimatedBudget() { return this.quotationForm.get('estimatedBudget'); }
  get outputType() { return this.quotationForm.get('outputType'); }
  get theme() { return this.quotationForm.get('theme'); }
  get attachedFiles() { return this.quotationForm.get('attachedFiles'); }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const quotationId = params.get('id');
      if (quotationId) {
        // We're in edit mode, fetch the quotation data
        this.userService.getQuotationById(quotationId).subscribe({
          next: (quotation) => {
            // Populate the form with existing data
            this.populateForm(quotation);
          },
          error: (error) => {
            console.error('Error fetching quotation:', error);
            this.showMessage('Error loading quotation data');
            // Navigate back to quotations list if we can't load the data
            this.router.navigate(['/user/quotations']);
          }
        });
      }
    });
  }

  private populateForm(quotation: IQuotation): void {
    // Format the date properly for the form
    let dueDate = '';
    if (quotation.dueDate) {
      const date = new Date(quotation.dueDate);
      // Format to YYYY-MM-DDThh:mm
      dueDate = date.toISOString().slice(0, 16);
    }
    
    // Set form values from the quotation
    this.quotationForm.patchValue({
      title: quotation.title,
      description: quotation.description,
      theme: quotation.theme || '',
      dueDate: dueDate,
      estimatedBudget: quotation.estimatedBudget,
      outputType: quotation.outputType,
    });

    // Handle attached files if they exist
    if (quotation.attachedFiles && quotation.attachedFiles.length > 0) {
      this.uploadedFiles = [...quotation.attachedFiles as FileAttachmentResponse[]];
      this.quotationForm.get('attachedFiles')?.setValue(this.uploadedFiles);
    }
  }

  protected isEditMode(): boolean {
    return this.route.snapshot.paramMap.has('id');
  }

  private getQuotationId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  onSubmit() {
    if(this.isUploading){
      this.showMessage('Please wait for file uploads to complete');
      return;
    }
    if (this.quotationForm.valid) {
      console.log(this.quotationForm.value);
      const formData = { ...this.quotationForm.value };
      formData.attachedFiles = this.uploadedFiles;

      if (formData.dueDate) {
        formData.dueDate = new Date(formData.dueDate).toISOString();
      }

      if (this.isEditMode()) {
        // Update existing quotation
        const quotationId = this.getQuotationId();
        if (!quotationId) {
          this.showMessage('Error: Quotation ID not found');
          return;
        }

        this.userService.updateQuotation(quotationId, formData).subscribe({
          next: (response) => {
            console.log('Quotation updated successfully');
            this.showMessage('Quotation updated successfully');
            this.router.navigate(['/user/quotations']);
          },
          error: (error) => {
            console.error(error);
            this.showMessage('Error updating quotation');
          }
        });
      } else {
        // Create new quotation
        this.userService.createQuotation(formData).subscribe({
          next: (response) => {
            console.log('Quotation created successfully');
            this.showMessage('Quotation created successfully');
            this.router.navigate(['/user/quotations']);
          },
          error: (error) => {
            console.error(error);
            this.showMessage('Error creating quotation');
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.quotationForm);
      this.showMessage('Please fill all required fields');
    }
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
    this.selectedFiles.splice(index, 1);
    if(this.fileInput){
      this.fileInput.nativeElement.value = '';
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.showMessage('Please select files to upload');
      return;
    }
    
    this.isUploading = true;

    this.userService.uploadQuotationFiles(this.selectedFiles).subscribe({
      next: (results) => {
        this.uploadedFiles = [...this.uploadedFiles, ...results];
        // Add the uploaded files to the form
        const attachedFilesControl = this.quotationForm.get('attachedFiles');
        if (attachedFilesControl) {
            attachedFilesControl.setValue(this.uploadedFiles);
        }
        this.selectedFiles = []; // Clear selected files
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
