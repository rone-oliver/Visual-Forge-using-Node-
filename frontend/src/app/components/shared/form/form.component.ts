import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

interface FormControlConfig {
  name: string;
  label: string;
  type: string;
  validators?: ValidatorFn[];
}

@Component({
  selector: 'app-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent implements OnInit {
  @Input() formControls: FormControlConfig[]=[];
  @Input() submitButtonLabel: string = 'Submit';
  @Output() formSubmit = new EventEmitter<any>();

  myForm!: FormGroup;
  constructor(private fb: FormBuilder){};

  ngOnInit(): void {
    this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formControls']) {
      this.createForm();
    }
  }

  createForm(){
    const controls : { [key:string]: FormControl}={};
    this.formControls.forEach((control: FormControlConfig)=>{
      controls[control.name]= new FormControl('',control.validators || [])
    });
    this.myForm = this.fb.group(controls);
  }

  onSubmit(){
    if(this.myForm.valid){
      this.formSubmit.emit(this.myForm.value);
    }
  }

  getControlErrors(controlName: string): string[] {
    const control = this.myForm.get(controlName);
    const errors = control?.errors ?? {};

    return Object.keys(errors).map(errorKey => {
        switch (errorKey) {
          case 'required': return `${controlName} is required.`;
          case 'email': return `${controlName} is not a valid email.`;
          case 'minlength': return `${controlName} must be at least ${errors['minlength']?.requiredLength} characters long.`;
          default: return `${controlName} has an error.`;
        }
    });
  }

  // username:string='';
  // password:string='';
  // constructor(private authService: AuthService){};
  // Login(){
  //   this.authService.adminLogin(this.username, this.password).subscribe((res:any)=>{
  //     console.log(res);
  //   });
  // }
  // Register(){
  //   this.authService.adminRegister({username:this.username, password:this.password}).subscribe((res:any)=>{
  //     console.log(res);
  //   });
  // }
}
