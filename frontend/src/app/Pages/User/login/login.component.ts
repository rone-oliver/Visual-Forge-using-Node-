import { Component } from '@angular/core';
import { FormComponent } from '../../../components/shared/form/form.component';
import { Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [FormComponent,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
     private router: Router
    ) {}
  loginControls = [
    { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
    { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
  ];
  
  onFormSubmit(credentials: { username: string; password: string }) {
    console.log("Login Form Data:", credentials);
    this.authService.login(credentials, 'User').subscribe({
      next: (response) => {
        this.authService.setAccessToken(response.accessToken,'User');
        this.router.navigate(['/user']);
      },
      error: (error) => {
        // needs to handle error
        console.error('Login failed:', error);
      }
    });
  }
}
