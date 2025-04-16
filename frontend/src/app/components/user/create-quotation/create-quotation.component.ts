import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-quotation',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-quotation.component.html',
  styleUrl: './create-quotation.component.scss'
})
export class CreateQuotationComponent {
  quotationForm: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.quotationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      theme: [''],
      dueDate: [''],
      price: ['']
    });
  }

  onSubmit() {
    if (this.quotationForm.valid) {
      console.log(this.quotationForm.value);
      // Add your submission logic here
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
