import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { FormComponent } from '../../shared/form/form.component';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleAuthService } from '../../../services/shared/google-auth.service';
import { environment } from '../../../../environments/environment';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

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
  canResendOtp = false;
  countdownValue = 0;
  private countdownSubscription: Subscription | null = null;
  private registrationEmail: string = '';
  private readonly COUNTDOWN_STORAGE_KEY = 'otpCountdownEndTime';
  private readonly EMAIL_STORAGE_KEY = 'registrationEmail';

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
        this.registrationEmail = formData.email;
        localStorage.setItem(this.EMAIL_STORAGE_KEY, formData.email);
        this.startCountdown(30);
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

  private startCountdown(seconds: number) {
    // Clear any existing countdown
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }

    // Set end time in localStorage
    const endTime = new Date().getTime() + seconds * 1000;
    localStorage.setItem(this.COUNTDOWN_STORAGE_KEY, endTime.toString());

    // Start countdown
    this.countdownValue = seconds;
    this.canResendOtp = false;

    this.countdownSubscription = interval(1000)
      .pipe(takeWhile(() => this.countdownValue > 0))
      .subscribe(() => {
        this.countdownValue--;
        if (this.countdownValue === 0) {
          this.canResendOtp = true;
          if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
            this.countdownSubscription = null;
          }
        }
      });
  }

  resendOtp() {
    if (!this.canResendOtp) return;

    const email = this.registrationEmail || localStorage.getItem(this.EMAIL_STORAGE_KEY);
    if (!email) {
      this.showError('Email not found. Please register again.');
      return;
    }

    this.authService.resendOtp(email).subscribe({
      next: (response: boolean) => {
        if (response === true) {
          this.showSuccess('OTP has been resent to your email');
          this.startCountdown(30);
        } else {
          this.showError('Failed to resend OTP. Please try again.');
        }
      },
      error: (error) => {
        console.error('Error resending OTP:', error);
        this.showError('Failed to resend OTP. Please try again.');
      }
    });
  }

  goBackToRegistration() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
    
    // Clear localStorage items
    localStorage.removeItem(this.COUNTDOWN_STORAGE_KEY);
    localStorage.removeItem(this.EMAIL_STORAGE_KEY);
    
    // Reset component state
    this.isVerifying = false;
    this.canResendOtp = false;
    this.countdownValue = 0;
    this.registrationEmail = '';
    this.errorMessage = '';
    this.successMessage = '';
    
    // Reset form controls to registration form
    this.registerControls = [
      { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
      { name: 'email', label: 'Email', type: 'email', validators: [Validators.required, Validators.email] },
      { name: 'fullname', label: 'Fullname', type: 'text', validators: [Validators.required, Validators.minLength(3)] },
      { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
    ];
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
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
    this.checkExistingVerification();
  }

  private checkExistingVerification() {
    const endTimeStr = localStorage.getItem(this.COUNTDOWN_STORAGE_KEY);
    const email = localStorage.getItem(this.EMAIL_STORAGE_KEY);

    if (endTimeStr && email) {
      const endTime = parseInt(endTimeStr, 10);
      const now = new Date().getTime();
      const remainingTime = Math.floor((endTime - now) / 1000);

      if (remainingTime > 0) {
        // Still in countdown period
        this.isVerifying = true;
        this.registrationEmail = email;
        this.registerControls = this.otpControls;
        this.startCountdown(remainingTime);
      } else {
        // Countdown finished but user still in verification mode
        this.isVerifying = true;
        this.registrationEmail = email;
        this.registerControls = this.otpControls;
        this.canResendOtp = true;
        this.countdownValue = 0;
      }
    }
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

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
}
