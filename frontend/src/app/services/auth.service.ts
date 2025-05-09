import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, of, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
}

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: 'User' | 'Editor' | 'Admin';
  iat: number;
  exp: number;
}

export type UserType = 'Admin' | 'User';
export interface LoginResponse {
  accessToken: string;
}
interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  fullname: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private backendUrl = environment.apiUrl;
  private registrationEmail: string | null = null;

  private userIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  userIsAuthenticated$ = this.userIsAuthenticatedSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(null);
  userRole$ = this.userRoleSubject.asObservable();

  private adminIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  adminIsAuthenticated$ = this.adminIsAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private tokenService: TokenService) {
    this.initializeAuth();
  };

  private initializeAuth(): void {
    const userToken = this.tokenService.getToken('User');
    if (userToken) {
      this.userIsAuthenticatedSubject.next(true);
      this.setRole(userToken, 'User');
    }

    const adminToken = this.tokenService.getToken('Admin');
    if (adminToken) {
      this.adminIsAuthenticatedSubject.next(true);
      // this.setRole(adminToken,'Admin');
    }
  }

  private setRole(token: string, userType: 'User' | 'Admin') {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (userType === 'User') {
        console.log('User role: ', payload.role);
        this.userRoleSubject.next(payload.role);
      }
    } catch (error) {
      console.error('Unable to decode token')
    }
  }

  getAccessToken(userType: 'User' | 'Admin'): string | null {
    const token = this.tokenService.getToken(userType);
    if (token && this._isTokenValid(token)) {
      return token;
    }
    return null;
  }

  setAccessToken(token: string, userType: 'User' | 'Admin'): void {
    this.tokenService.setToken(token, userType);
    if (userType === 'User') {
      // this.userAccessTokenSubject.next(token);
      console.log('inside the userType User block in the setAccessToken method');
      this.userIsAuthenticatedSubject.next(this._isTokenValid(token));
      this.setRole(token, 'User');
    } else {
      // this.adminAccessTokenSubject.next(token);
      this.adminIsAuthenticatedSubject.next(this._isTokenValid(token));
      this.setRole(token, 'Admin');
    }
  }

  logout(userType: 'User' | 'Admin'): Observable<any> {
    return this.http.delete(`${this.backendUrl}/auth/logout?userType=${userType}`, {
      withCredentials: true
    }).pipe(
      map(response => {
        console.log('Logout response:', response);
        this.tokenService.clearToken(userType);
        if (userType === 'User') {
          // this.userAccessTokenSubject.next(null);
          this.userIsAuthenticatedSubject.next(false);
          this.userRoleSubject.next(null);
        } else {
          // this.adminAccessTokenSubject.next(null);
          this.adminIsAuthenticatedSubject.next(false);
          // this.adminRoleSubject.next(null);
        }
        return response;
      }),
      catchError(error => {
        console.error('Logout failed:', error);
        this.tokenService.clearToken(userType);
        if (userType === 'User') {
          // this.userAccessTokenSubject.next(null);
          this.userIsAuthenticatedSubject.next(false);
          this.userRoleSubject.next(null);
        } else {
          // this.adminAccessTokenSubject.next(null);
          this.adminIsAuthenticatedSubject.next(false);
          // this.adminRoleSubject.next(null);
        }
        return throwError(() => error);
      })
    );
  }

  refreshAccessToken(userType: 'User' | 'Admin'): Observable<{ accessToken: string, userType: UserType }> {
    return this.http.get<{ accessToken: string, userType: UserType }>(`${this.backendUrl}/auth/refresh`, {
      withCredentials: true,
      params: new HttpParams().set('role', userType)
    }).pipe(
      map(response => {
        this.setAccessToken(response.accessToken, userType);
        return { accessToken: response.accessToken, userType };
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.tokenService.clearToken(userType);
        // this.clearToken();
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginCredentials, userType: UserType): Observable<LoginResponse> {
    const loginEndpoint = userType === 'Admin'
      ? `${this.backendUrl}/auth/admin/login`
      : `${this.backendUrl}/auth/user/login`;

    return this.http.post<LoginResponse>(loginEndpoint, credentials, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('login success and setAccessToken called');
          this.setAccessToken(response.accessToken, userType);
        }),
        catchError(error => {
          this.tokenService.clearToken(userType);
          return throwError(() => error);
        })
      );
  }

  register(credentials: RegisterCredentials): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/auth/user/register`, credentials, { withCredentials: true })
      .pipe(
        tap({
          next: (response) => {
            console.log('Registration response:', response);
            if (response.success) {
              this.registrationEmail = response.data.user.email;
              return true;
            }
            throw response.error;
          },
          error: (error) => {
            console.error('Error from auth.service on registering:', error);
            throw error;
          }
        }),
        catchError(error => {
          console.log('Raw error from server:', error);
          console.log('Error status:', error.status);
          console.log('Error response:', error.error);
          if (error instanceof HttpErrorResponse && error.error?.error) {
            console.log("response error propogated to the component");
            throw error.error.error;
          }
          return throwError(() => error);
        })
      );
  }

  resendOtp(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.backendUrl}/auth/user/resend-otp`, { email }).pipe(
      map(response => {
        console.log("email verification response: ", response);
        if(response){
          this.registrationEmail = email;
        }
        return response;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  verifyEmail(otp: string): Observable<boolean> {
    if (!this.registrationEmail) {
      throw new Error('No registration email found');
    }

    return this.http.post<{ success: boolean }>(`${this.backendUrl}/auth/user/verify-email`, {
      email: this.registrationEmail,
      otp: otp
    }, { withCredentials: true })
      .pipe(
        map(response => {
          console.log("email verification response: ", response);
          return response.success;
        }),
        tap(verified => {
          if (verified) {
            // Clear registration email after successful verification
            this.registrationEmail = null;
            // Navigate to login page
            // this.router.navigate(['/auth/login']);
          }
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  sendPasswordResetOtp(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.backendUrl}/auth/user/forgot-password`, { email }).pipe(
      map(response => {
        console.log("Password reset OTP sent response: ", response);
        this.registrationEmail = email; // Store email for verification
        return true;
      }),
      catchError(error => {
        console.error('Error sending password reset OTP:', error);
        return throwError(() => error);
      })
    );
  }

  verifyPasswordResetOtp(otp: string): Observable<boolean> {
    if (!this.registrationEmail) {
      return throwError(() => new Error('No email found for password reset'));
    }

    return this.http.post<{ success: boolean }>(`${this.backendUrl}/auth/user/verify-reset-otp`, {
      email: this.registrationEmail,
      otp: otp
    }).pipe(
      map(response => {
        console.log("Password reset OTP verification response: ", response);
        return response.success;
      }),
      catchError(error => {
        console.error('Error verifying password reset OTP:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(newPassword: string): Observable<boolean> {
    if (!this.registrationEmail) {
      return throwError(() => new Error('No email found for password reset'));
    }

    return this.http.post<boolean>(`${this.backendUrl}/auth/user/reset-password`, {
      email: this.registrationEmail,
      newPassword: newPassword
    }).pipe(
      map(response => {
        console.log("Password reset response: ", response);
        this.registrationEmail = null; // Clear email after reset
        return response;
      }),
      catchError(error => {
        console.error('Error resetting password:', error);
        return throwError(() => error);
      })
    );
  }

  private extractJwtPayload(token: string) {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Unable to decode the token', error);
      throw new Error;
    }
  }

  private _isTokenValid(token: string): boolean {
    console.log('inside the _isTokenValid method');
    // if (!this.accessToken) return of(false);
    // console.log("jwt payload from _isTokenValid fn",this.jwtPayload);
    // if (!this.jwtPayload) return false;
    const jwtPayload = this.extractJwtPayload(token);
    const currentTime = Math.floor(Date.now() / 1000);
    // alert(`is jwt expired? ${jwtPayload.exp<currentTime}`)
    return jwtPayload.exp > currentTime;
  }

  isAuthenticated(userType: 'User' | 'Admin'): boolean {
    // alert(this.tokenService.getToken(userType));
    const token = this.tokenService.getToken(userType);
    return !!token && this._isTokenValid(token);
  }

  hasRole(role: string, userType: 'User' | 'Admin'): boolean {
    const token = this.tokenService.getToken(userType);
    if (!token) return false;

    try {
      const payload = this.extractJwtPayload(token);
      return payload.role === role;
    } catch {
      return false;
    }
  }
}
