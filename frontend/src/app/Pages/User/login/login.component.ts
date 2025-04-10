import { Component, NgZone, OnInit } from '@angular/core';
import { FormComponent } from '../../../components/shared/form/form.component';
import { Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleAuthService } from '../../../services/shared/google-auth.service';

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
  imports: [FormComponent, RouterModule, CommonModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;

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

  ngOnInit() {
    this.initializeGoogleSignIn();
  }

  onFormSubmit(credentials: { username: string; password: string }) {
    console.log("Login Form Data:", credentials);
    this.authService.login(credentials, 'User').subscribe({
      next: (response) => {
        this.authService.setAccessToken(response.accessToken, 'User');
        this.router.navigate(['/user']);
      },
      error: (error) => {
        // needs to handle error
        console.error('Login failed:', error);
      }
    });
  }

  private showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
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
