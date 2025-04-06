import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UserRegisterComponent } from '../../user/user-register/user-register.component';
import { Router } from '@angular/router';

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
  constructor(private fb: FormBuilder, private router: Router){};

  ngOnInit(): void {
    const currentRoute = this.router.url;
    if(
      currentRoute === '/auth/login' || 
      currentRoute === '/auth/register' ||
      currentRoute === '/auth/admin/login'
    ){
      document.documentElement.classList.remove('dark');
    }
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
    this.myForm = this.fb.group(controls, {
      validators: UserRegisterComponent.confirmPasswordValidator
    });
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
          case 'passwordMismatch': return `Passwords do not match.`;
          case 'invalidOTP': return `OTP is not valid.`;
          default: return `${controlName} has an error.`;
        }
    });
  }
}
