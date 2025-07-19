import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, EMPTY, finalize, map, Observable, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';
import { AuthenticatedUser } from '../interfaces/user.interface';
import { LoggerService } from './logger.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
}

export interface JwtPayload {
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
  private readonly _backendUrl = environment.apiUrl;
  private _registrationEmail: string | null = null;
  private _refreshTokenInProgress = false;

  private readonly _currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  private readonly _userRoleSubject = new BehaviorSubject<string | null>(null);
  private readonly _userIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly _adminIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  currentUser$ = this._currentUserSubject.asObservable();
  userRole$ = this._userRoleSubject.asObservable();
  userIsAuthenticated$ = this._userIsAuthenticatedSubject.asObservable();
  adminIsAuthenticated$ = this._adminIsAuthenticatedSubject.asObservable();

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _tokenService = inject(TokenService);
  private readonly _logger = inject(LoggerService);

  constructor() {
    this._initializeAuth();
  };

  private _initializeAuth(): void {
    const userToken = this._tokenService.getToken('User');
    if (userToken) {
      // this._userIsAuthenticatedSubject.next(true);
      // this.setRole(userToken, 'User');
      this._updateUserState(userToken);
    }

    const adminToken = this._tokenService.getToken('Admin');
    if (adminToken) {
      this._adminIsAuthenticatedSubject.next(true);
      // this.setRole(adminToken,'Admin');
    }
  }

  private _updateUserState(token: string | null): void {
    if (token && this._isTokenValid(token)) {
      const user = jwtDecode<AuthenticatedUser>(token);
      this._currentUserSubject.next(user);
      this._userIsAuthenticatedSubject.next(true);
      this._userRoleSubject.next(user.role);
    } else {
      this._currentUserSubject.next(null);
      this._userIsAuthenticatedSubject.next(false);
      this._userRoleSubject.next(null);
    }
  }

  private _setRole(token: string, userType: 'User' | 'Admin') {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (userType === 'User') {
        this._logger.info('User role: ', payload.role);
        this._userRoleSubject.next(payload.role);
      }
    } catch (error) {
      this._logger.error('Unable to decode token')
    }
  }

  getAccessToken(userType: 'User' | 'Admin'): string | null {
    const token = this._tokenService.getToken(userType);
    if (token && this._isTokenValid(token)) {
      return token;
    }
    return null;
  }

  setAccessToken(token: string, userType: 'User' | 'Admin'): void {
    this._tokenService.setToken(token, userType);
    if (userType === 'User') {
      // this.userAccessTokenSubject.next(token);
      // this._logger.info('inside the userType User block in the setAccessToken method');
      // this._userIsAuthenticatedSubject.next(this._isTokenValid(token));
      // this.setRole(token, 'User');
      this._updateUserState(token);
    } else {
      // this.adminAccessTokenSubject.next(token);
      this._adminIsAuthenticatedSubject.next(this._isTokenValid(token));
      this._setRole(token, 'Admin');
    }
  }

  logout(userType: 'User' | 'Admin'): Observable<any> {
    return this._http.delete(`${this._backendUrl}/auth/logout?userType=${userType}`, {
      withCredentials: true
    }).pipe(
      map(response => {
        this._logger.debug('Logout response:', response);
        this._tokenService.clearToken(userType);
        if (userType === 'User') {
          // this.userAccessTokenSubject.next(null);
          this._userIsAuthenticatedSubject.next(false);
          this._userRoleSubject.next(null);
        } else {
          // this.adminAccessTokenSubject.next(null);
          this._adminIsAuthenticatedSubject.next(false);
          // this.adminRoleSubject.next(null);
        }
        return response;
      }),
      catchError(error => {
        this._logger.error('Logout failed:', error);
        this._tokenService.clearToken(userType);
        if (userType === 'User') {
          // this.userAccessTokenSubject.next(null);
          this._userIsAuthenticatedSubject.next(false);
          this._userRoleSubject.next(null);
        } else {
          // this.adminAccessTokenSubject.next(null);
          this._adminIsAuthenticatedSubject.next(false);
          // this.adminRoleSubject.next(null);
        }
        return throwError(() => error);
      })
    );
  }

  private setRefreshInProgress(value: boolean) {
    this._refreshTokenInProgress = value;
  }

  isRefreshInProgress(): boolean {
    return this._refreshTokenInProgress;
  }

  refreshAccessToken(userType: 'User' | 'Admin'): Observable<{ accessToken: string, userType: UserType }> {
    if (this._refreshTokenInProgress) {
      return EMPTY;
    }

    this.setRefreshInProgress(true);

    return this._http.get<{ accessToken: string, userType: UserType }>(`${this._backendUrl}/auth/refresh`, {
      withCredentials: true,
      params: new HttpParams().set('role', userType)
    }).pipe(
      map(response => {
        this.setAccessToken(response.accessToken, userType);
        return { accessToken: response.accessToken, userType };
      }),
      catchError(error => {
        this._logger.error('Token refresh failed:', error);
        this._tokenService.clearToken(userType);
        // this.clearToken();
        return throwError(() => error);
      }),
      finalize(() => {
        this.setRefreshInProgress(false);
      })
    );
  }

  login(credentials: LoginCredentials, userType: UserType): Observable<LoginResponse> {
    const loginEndpoint = userType === 'Admin'
      ? `${this._backendUrl}/auth/admin/login`
      : `${this._backendUrl}/auth/user/login`;

    return this._http.post<LoginResponse>(loginEndpoint, credentials, { withCredentials: true })
      .pipe(
        tap(response => {
          this._logger.info('Login success and setAccessToken called');
          this.setAccessToken(response.accessToken, userType);
        }),
        catchError(error => {
          this._tokenService.clearToken(userType);
          return throwError(() => error);
        })
      );
  }

  register(credentials: RegisterCredentials): Observable<any> {
    return this._http.post<any>(`${this._backendUrl}/auth/user/register`, credentials, { withCredentials: true })
      .pipe(
        tap({
          next: (response) => {
            this._logger.debug('Registration response:', response);
            if (response.success) {
              this._registrationEmail = response.data.user.email;
              return true;
            }
            throw response.error;
          },
          error: (error) => {
            this._logger.error('Error from auth.service on registering:', error);
            throw error;
          }
        }),
        catchError(error => {
          if (error instanceof HttpErrorResponse && error.error?.error) {
            throw error.error.error;
          }
          return throwError(() => error);
        })
      );
  }

  resendOtp(email: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._backendUrl}/auth/user/resend-otp`, { email }).pipe(
      map(response => {
        this._logger.debug("email verification response: ", response);
        if(response){
          this._registrationEmail = email;
        }
        return response;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  verifyEmail(otp: string): Observable<boolean> {
    if (!this._registrationEmail) {
      throw new Error('No registration email found');
    }

    return this._http.post<{ success: boolean }>(`${this._backendUrl}/auth/user/verify-email`, {
      email: this._registrationEmail,
      otp: otp
    }, { withCredentials: true })
      .pipe(
        map(response => {
          this._logger.debug("email verification response: ", response);
          return response.success;
        }),
        tap(verified => {
          if (verified) {
            // Clear registration email after successful verification
            this._registrationEmail = null;
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
    return this._http.post<boolean>(`${this._backendUrl}/auth/user/forgot-password`, { email }).pipe(
      map(response => {
        this._logger.debug("Password reset OTP sent response: ", response);
        this._registrationEmail = email; // Store email for verification
        return true;
      }),
      catchError(error => {
        this._logger.error('Error sending password reset OTP:', error);
        return throwError(() => error);
      })
    );
  }

  verifyPasswordResetOtp(otp: string): Observable<boolean> {
    if (!this._registrationEmail) {
      return throwError(() => new Error('No email found for password reset'));
    }

    return this._http.post<{ success: boolean }>(`${this._backendUrl}/auth/user/verify-reset-otp`, {
      email: this._registrationEmail,
      otp: otp
    }).pipe(
      map(response => {
        this._logger.debug("Password reset OTP verification response: ", response);
        return response.success;
      }),
      catchError(error => {
        this._logger.error('Error verifying password reset OTP:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(newPassword: string): Observable<boolean> {
    if (!this._registrationEmail) {
      return throwError(() => new Error('No email found for password reset'));
    }

    return this._http.post<boolean>(`${this._backendUrl}/auth/user/reset-password`, {
      email: this._registrationEmail,
      newPassword: newPassword
    }).pipe(
      map(response => {
        this._logger.debug("Password reset response: ", response);
        this._registrationEmail = null; // Clear email after reset
        return response;
      }),
      catchError(error => {
        this._logger.error('Error resetting password:', error);
        return throwError(() => error);
      })
    );
  }

  private _extractJwtPayload(token: string) {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      this._logger.error('Unable to decode the token', error);
      throw new Error;
    }
  }

  private _isTokenValid(token: string): boolean {
    this._logger.info('inside the _isTokenValid method');
    // if (!this.accessToken) return of(false);
    // this._logger.info("jwt payload from _isTokenValid fn",this.jwtPayload);
    // if (!this.jwtPayload) return false;
    const jwtPayload = this._extractJwtPayload(token);
    const currentTime = Math.floor(Date.now() / 1000);
    // this._logger.info('jwtPayload', jwtPayload);
    // alert(`is jwt expired? ${jwtPayload.exp<currentTime}`)
    return jwtPayload.exp > (currentTime+30);
  }

  isAuthenticated(userType: 'User' | 'Admin'): boolean {
    const token = this._tokenService.getToken(userType);
    return !!token && this._isTokenValid(token);
  }

  getUserId(userType: 'User' | 'Admin' = 'User'): string | null {
    const token = this.getAccessToken(userType);
    if (token) {
        try {
            const payload = this._extractJwtPayload(token);
            return payload.userId;
        } catch (error) {
            this._logger.error('Error extracting user ID from token:', error);
            return null;
        }
    }
    return null;
  }

  hasRole(role: string, userType: 'User' | 'Admin'): boolean {
    const token = this._tokenService.getToken(userType);
    if (!token) return false;

    try {
      const payload = this._extractJwtPayload(token);
      return payload.role === role;
    } catch {
      return false;
    }
  }
}
