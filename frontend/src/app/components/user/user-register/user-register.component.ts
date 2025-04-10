import { Component, NgZone, OnInit } from '@angular/core';
import { FormComponent } from '../../shared/form/form.component';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleAuthService } from '../../../services/shared/google-auth.service';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
    handleCredentialResponse?: (response: any) => void;
  }
}

@Component({
  selector: 'app-user-register',
  imports: [FormComponent, CommonModule, RouterModule, MatIconModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class UserRegisterComponent implements OnInit {
  isVerifying = false;
  errorMessage: string = '';
  successMessage: string = '';

  static confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  static otpValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && !/^\d+$/.test(value)) {
      return { 'invalidOTP': true };
    }
    return null;
  }

  registerControls = [
    { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
    { name: 'email', label: 'Email', type: 'email', validators: [Validators.required, Validators.email] },
    { name: 'fullname', label: 'Fullname', type: 'text', validators: [Validators.required, Validators.minLength(3)] },
    { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
  ];
  otpControls = [
    { name: 'otp', label: 'OTP', type: 'text', validators: [Validators.required, Validators.minLength(6), UserRegisterComponent.otpValidator] }
  ]
  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private googleAuthService: GoogleAuthService,
  ) { };

  onFormSubmit(formData: any) {
    console.log("Register Form Data: ", formData);
    if (this.isVerifying) {
      this.verifyOtp(formData.otp);
    } else {
      this.register(formData);
    }
  }

  private register(formData: any) {
    this.authService.register(formData).subscribe({
      next: () => {
        this.isVerifying = true;
        this.errorMessage = '';
        this.registerControls = this.otpControls;
      },
      error: (error) => {
        console.error('Error on registering the user: ', error);
        if (error) {
          // Handle specific error messages
          if (error.usernameExists) {
            this.showError('Username is already taken. Please choose a different username.');
          } else if (error.emailExists) {
            this.showError('Email is already registered. Please use a different email address.');
          } else {
            this.showError('Registration failed. Please try again.');
          }
        } else {
          this.showError('An unexpected error occurred. Please try again.');
        }
      }
    })
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  private verifyOtp(otp: string) {
    console.log(otp);
    this.authService.verifyEmail(otp).subscribe({
      next: (response) => {
        if (response) {
          this.successMessage = 'Email verified successfully';
          setTimeout(() => {
            this.router.navigate(['/auth/login'])
          }, 1000)
        } else {
          this.showError('Invalid OTP, Please try again.')
        }
      },
      error: (error) => {
        console.error('Error on verifying the email: ', error);
        this.showError('Invalid OTP, Please try again.')
      }
    })
  }

  ngOnInit() {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => {
            this.ngZone.run(() => {
              this.handleCredentialResponse(response);
            });
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv')!,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left'
          }
        );
      }
    };
  }

  private handleCredentialResponse(response: any) {
    console.log("Google response:", response);
    if (response.credential) {
      this.handleGoogleSignIn(response.credential);
    } else {
      this.showError('Google sign-in failed: No credential received');
    }
  }

    //for google signup
    private handleGoogleSignIn(credential: string) {
      this.googleAuthService.verifyGoogleToken(credential).subscribe({
        next: (response: any) => {
          if (response) {
            this.successMessage = 'Google sign-in successful';
  
            setTimeout(() => {
              this.router.navigate(['/user']);
            }, 1000);
          } else {
            this.showError('Login failed: Google sign-in failed');
          }
        },
        error: (error) => {
          console.error('Google signin error', error);
          this.showError(error.error?.message || 'Google sign-in failed');
        }
      });
    }
}
