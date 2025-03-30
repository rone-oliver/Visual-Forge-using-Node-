import { Component } from '@angular/core';
import { FormComponent } from '../../../components/shared/form/form.component';
import { Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  imports: [FormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {};

  loginControls = [
    { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
    { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
  ];
  
  onFormSubmit(formData:{username:string, password: string}){
    console.log("Login Form Data:", formData);
    this.authService.login(formData, "Admin").subscribe({
      next:()=>{
        this.router.navigate(['/admin/dashboard'])
      },
      error:(error)=>{
        // Needs to handle error
        console.error('Login Failed:', error);
      }
    })
  }
}
