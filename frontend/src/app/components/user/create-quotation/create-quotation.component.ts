import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { Router } from '@angular/router';
import { FileAttachmentResponse, FileType, OutputType } from '../../../interfaces/quotation.interface';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface FileWithProgress {
  file: File;
  progress: number;
}

@Component({
  selector: 'app-create-quotation',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './create-quotation.component.html',
  styleUrl: './create-quotation.component.scss'
})
export class CreateQuotationComponent {
  quotationForm: FormGroup;
  outputTypes = Object.values(OutputType);
  selectedFiles: File[] = [];
  uploadedFiles: FileAttachmentResponse[] = [];
  isUploading: boolean = false;
  maxFiles = 5;
  // uploadProgress = 0;
  // uploadProgress: { [key: string]: number } = {};

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.quotationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      theme: [''],
      dueDate: [tomorrow, Validators.required],
      estimatedBudget: ['', [Validators.required, Validators.min(0)]],
      outputType: ['', Validators.required],
      attachedFiles: [[]],
    });
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
      })
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
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.showMessage('Please select files to upload');
      return;
    }
    
    this.isUploading = true;

    this.userService.uploadQuotationFiles(this.selectedFiles).subscribe({
      next: (results) => {
        this.uploadedFiles = results;
        // Add the uploaded files to the form
        const attachedFilesControl = this.quotationForm.get('attachedFiles');
        if (attachedFilesControl) {
            attachedFilesControl.setValue(results);
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
      verticalPosition: 'bottom'
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
