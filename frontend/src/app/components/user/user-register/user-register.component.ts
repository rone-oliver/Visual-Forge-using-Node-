import { Component } from '@angular/core';
import { FormComponent } from '../../shared/form/form.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-register',
  imports: [FormComponent,CommonModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class UserRegisterComponent {
  isVerifying = false;
  registerControls = [
    { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
    { name: 'email', label: 'Email', type: 'email', validators: [Validators.required, Validators.email] },
    { name: 'fullname', label: 'Fullname', type: 'text', validators:[Validators.required, Validators.minLength(3)]},
    { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
  ];
  otpControls = [
    { name: 'otp', label: 'OTP', type: 'text', validators: [Validators.required,Validators.minLength(6)]}
  ]
  constructor(
    private authService: AuthService,
    private router: Router
  ){};

  onFormSubmit(formData: any){
    console.log("Register Form Data: ", formData);
    if(this.isVerifying){
      this.verifyOtp(formData.otp);
    }else{
      this.register(formData);
    }
  }
  
  private register(formData:any){
    this.authService.register(formData).subscribe({
      next:()=>{
        this.isVerifying = true;
        this.registerControls = this.otpControls;
      },
      error:(error)=>{
        console.error('Error on registering the user: ', error);
      }
    })
  }

  private verifyOtp(otp:string){
    console.log(otp);
    this.authService.verifyEmail(otp).subscribe({
      next:()=>{
        this.router.navigate(['/auth/login'])
      },
      error:(error)=>{
        console.error('Error on verifying the email: ', error);
      }
    })
  }
}
