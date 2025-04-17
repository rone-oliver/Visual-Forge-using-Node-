import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { Router } from '@angular/router';
import { OutputType } from '../../../interfaces/quotation.interface';

@Component({
  selector: 'app-create-quotation',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-quotation.component.html',
  styleUrl: './create-quotation.component.scss'
})
export class CreateQuotationComponent {
  quotationForm: FormGroup;
  outputTypes = Object.values(OutputType);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.quotationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      theme: [''],
      dueDate: [tomorrow, Validators.required],
      estimatedBudget: ['', [Validators.required, Validators.min(0)]],
      outputType: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.quotationForm.valid) {
      console.log(this.quotationForm.value);
      const formData = {...this.quotationForm.value};
      if(formData.dueDate){
        formData.dueDate = new Date(formData.dueDate).toISOString();
      }
      this.userService.createQuotation(formData).subscribe({
        next:(response)=>{
          console.log('Quotation created successfully');
          this.router.navigate(['/user/quotations']);
        },
        error:(error)=>{
          console.error(error);
        }
      })
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic
      console.log('File selected:', file.name);
    }
  }
}
