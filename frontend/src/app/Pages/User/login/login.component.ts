import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormComponent } from '../../../components/shared/form/form.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

import { MatIconModule } from '@angular/material/icon';
import { GoogleAuthService } from '../../../services/shared/google-auth.service';
import { interval, Subscription, takeWhile } from 'rxjs';

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
  selector: 'app-user-login',
  standalone: true,
  imports: [
    FormComponent,
    RouterModule,
    MatIconModule,
    ReactiveFormsModule
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;

  showForgotPassword: boolean = false;
  forgotPasswordStep: 'email' | 'otp' | 'newPassword' = 'email';
  isSubmittingForgotPassword: boolean = false;
  otpCountdown: number = 0;
  countdownInterval: any;
  storedEmail: string = '';

  private readonly COUNTDOWN_STORAGE_KEY = 'forgotPasswordCountdown';
  private readonly EMAIL_STORAGE_KEY = 'forgotPasswordEmail';
  private readonly STEP_STORAGE_KEY = 'forgotPasswordStep';
  private countdownSubscription: Subscription | null = null;
  canResendOtp: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private googleAuthService: GoogleAuthService,
  ) { }

  loginControls = [
    { name: 'username', label: 'Username', type: 'text', validators: [Validators.required, Validators.minLength(4)] },
    { name: 'password', label: 'Password', type: 'password', validators: [Validators.required, Validators.minLength(8)] },
  ];

  emailControls = [
    { name: 'email', label: 'Email', type: 'email', validators: [Validators.required, Validators.email] }
  ];

  otpControls = [
    { name: 'otp', label: 'OTP', type: 'text', validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)] }
  ];

  newPasswordControls = [
    { name: 'newPassword', label: 'New Password', type: 'password', validators: [Validators.required, Validators.minLength(8)], isPasswordField: true }
  ];

  ngOnInit() {
    this.initializeGoogleSignIn();
    this.checkExistingCountdown();
    this.checkForgotPasswordState();
  }

  private checkForgotPasswordState() {
    const storedStep = localStorage.getItem(this.STEP_STORAGE_KEY);
    const storedEmail = localStorage.getItem(this.EMAIL_STORAGE_KEY);

    if (storedStep && storedEmail) {
      this.showForgotPassword = true;
      this.forgotPasswordStep = storedStep as 'email' | 'otp' | 'newPassword';
      this.storedEmail = storedEmail;
    }
  }

  private checkExistingCountdown() {
    const storedEndTime = localStorage.getItem(this.COUNTDOWN_STORAGE_KEY);
    if (storedEndTime) {
      const endTime = parseInt(storedEndTime, 10);
      const now = new Date().getTime();
      const remainingTime = Math.floor((endTime - now) / 1000);

      if (remainingTime > 0) {
        this.startCountdown(remainingTime);
      } else {
        // Clear expired countdown
        localStorage.removeItem(this.COUNTDOWN_STORAGE_KEY);
        this.canResendOtp = true;
      }
    } else {
      this.canResendOtp = true;
    }
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotPasswordStep = 'email';
    this.errorMessage = '';
    this.successMessage = '';

    if (this.showForgotPassword) {
      localStorage.setItem(this.STEP_STORAGE_KEY, this.forgotPasswordStep);
    } else {
      // Clear the form when closing
      this.stopCountdown();
      this.storedEmail = '';
      localStorage.removeItem(this.STEP_STORAGE_KEY);
      localStorage.removeItem(this.EMAIL_STORAGE_KEY);
      localStorage.removeItem(this.COUNTDOWN_STORAGE_KEY);
    }
  }

  onEmailSubmit(formData: any) {
    this.sendPasswordResetOtp(formData.email);
  }

  onOtpSubmit(formData: any) {
    this.verifyPasswordResetOtp(formData.otp);
  }

  onNewPasswordSubmit(formData: any) {
    this.resetPassword(formData.newPassword);
  }

  sendPasswordResetOtp(email: string) {
    this.errorMessage = '';
    this.successMessage = '';

    // If this is a resend request, use the stored email
    if (email === 'resend') {
      if (!this.storedEmail) {
        this.errorMessage = 'Email not found. Please go back and enter your email again.';
        return;
      }
      email = this.storedEmail;
    } else {
      // Store the email for future use (like resending OTP)
      this.storedEmail = email;
      localStorage.setItem(this.EMAIL_STORAGE_KEY, email);
    }

    this.authService.sendPasswordResetOtp(email).subscribe({
      next: () => {
        this.showSuccess('OTP sent to your email');
        this.forgotPasswordStep = 'otp';
        localStorage.setItem(this.STEP_STORAGE_KEY, this.forgotPasswordStep);
        this.startCountdown();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  // Verify OTP for password reset
  verifyPasswordResetOtp(otp: string) {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyPasswordResetOtp(otp).subscribe({
      next: (success) => {
        if (success) {
          this.showSuccess('OTP verified successfully');
          this.forgotPasswordStep = 'newPassword';
          localStorage.setItem(this.STEP_STORAGE_KEY, this.forgotPasswordStep);
          this.stopCountdown();
        } else {
          this.errorMessage = 'Invalid OTP. Please try again.';
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to verify OTP. Please try again.';
      }
    });
  }

  // Reset password with new password
  resetPassword(newPassword: string) {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(newPassword).subscribe({
      next: (success) => {
        if (success) {
          this.showSuccess('Password reset successfully. You can now login with your new password.');
          this.showForgotPassword = false;
          this.forgotPasswordStep = 'email';
          this.storedEmail = '';

          localStorage.removeItem(this.STEP_STORAGE_KEY);
          localStorage.removeItem(this.EMAIL_STORAGE_KEY);
          localStorage.removeItem(this.COUNTDOWN_STORAGE_KEY);
        } else {
          this.errorMessage = 'Failed to reset password. Please try again.';
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  startCountdown(seconds: number = 30) {
    // Clear any existing countdown
    this.stopCountdown();

    // Set end time in localStorage
    const endTime = new Date().getTime() + seconds * 1000;
    localStorage.setItem(this.COUNTDOWN_STORAGE_KEY, endTime.toString());

    // Start countdown
    this.otpCountdown = seconds;
    this.canResendOtp = false;

    this.countdownSubscription = interval(1000)
      .pipe(takeWhile(() => this.otpCountdown > 0))
      .subscribe(() => {
        this.otpCountdown--;
        if (this.otpCountdown === 0) {
          this.canResendOtp = true;
          this.stopCountdown();
        }
      });
  }

  // Stop countdown and clean up
  stopCountdown() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
  }

  onFormSubmit(credentials: { username: string; password: string }) {
    console.log("Login Form Data:", credentials);
    this.authService.login(credentials, 'User').subscribe({
      next: (response) => {
        this.authService.setAccessToken(response.accessToken, 'User');
        this.showSuccess('Login successful! Redirecting...');
        this.router.navigate(['/user']);
      },
      error: (error) => {
        // needs to handle error
        console.error('Login failed:', error);
        this.showError(error.error?.message || 'Login failed. Please try again.');
      }
    });
  }

  ngOnDestroy() {
    const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (scriptElement) {
      scriptElement.remove();
    }
    this.stopCountdown();
    this.storedEmail = '';
  }

  private showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
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
          console.debug("Google response:", response)
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
