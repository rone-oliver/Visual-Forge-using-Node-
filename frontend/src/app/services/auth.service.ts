import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';

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
interface LoginResponse {
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
  private backendUrl = 'http://localhost:5000';
  private registrationEmail: string | null = null;
  private accessToken: string | null = null;
  private jwtPayload: JwtPayload | null = null;
  private accessTokenSubject = new BehaviorSubject<string | null>(this.accessToken);
  accessToken$ = this.accessTokenSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private userRoleSubject = new BehaviorSubject<string | null>(this.getUserRole());
  userRole$ = this.userRoleSubject.asObservable();

  constructor(private http: HttpClient) {
    if(this.accessToken){
      this.isAuthenticatedSubject.next(true);
      this.userRoleSubject.next(this.jwtPayload?.role || null);
    }
  };

  login(credentials: LoginCredentials,userType: UserType): Observable<LoginResponse>{
    const loginEndpoint = userType === 'Admin' 
      ? `${this.backendUrl}/auth/admin/login`
      : `${this.backendUrl}/auth/user/login`;

    return this.http.post<LoginResponse>(loginEndpoint, credentials, {withCredentials:true})
    .pipe(
      tap(response => {
        this.accessToken = response.accessToken;
        this.accessTokenSubject.next(response.accessToken);
        this.userRoleSubject.next(this.jwtPayload?.role || null);
        this._setJwtPayload(response.accessToken);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(error => {
        this.clearToken();
        return throwError(()=> error);
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<any>{
    return this.http.post<RegisterCredentials>(`${this.backendUrl}/auth/user/register`,credentials,{withCredentials:true})
    .pipe(
      tap(response=>{
        this.registrationEmail = response.email;
        return true;
      }),
      catchError(error=>{
        return throwError(()=>error);
      })
    )
  }

  verifyEmail(otp: string): Observable<boolean> {
    if (!this.registrationEmail) {
      throw new Error('No registration email found');
    }

    return this.http.post<{ verified: boolean }>(`${this.backendUrl}/auth/user/verify-email`, {
      email: this.registrationEmail,
      otp: otp
    }, { withCredentials: true })
      .pipe(
        map(response => {
          return response.verified;
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

  logout(): void{
    this.accessToken = null;
    this.accessTokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.userRoleSubject.next(null);
    this.accessToken=null;
    this.jwtPayload = null;
  }
  
  isAuthenticated(): boolean {
    return !!this.accessToken && this._isTokenValid();
  }

  hasRole(role: string): boolean {
    return this.jwtPayload?.role === role;      // Doubt
  }

  getUserRole(): string | null {
    return this.jwtPayload?.role || null;
  }

  refreshAccessToken(): Observable<string> {
    return this.http.get<{ accessToken: string }>(`${this.backendUrl}/auth/refresh`, {
      withCredentials: true
    }).pipe(
      map(response => {
        this.accessToken = response.accessToken;
        this.accessTokenSubject.next(response.accessToken);     // Doubt in the next line
        this._setJwtPayload(response.accessToken);
        return response.accessToken;
      }),
      catchError(error => {
        this.accessToken = null;
        this.accessTokenSubject.next(null);
        this.jwtPayload = null;
        return throwError(() => error);
      })
    );
  }

  // Not finished
  private _setJwtPayload(accessToken: string): JwtPayload | null {
    try {
      this.jwtPayload = jwtDecode<JwtPayload>(accessToken);
      return this.jwtPayload;
    } catch (error) {
      this.jwtPayload = null;
      return null;
    }
  }

  private _isTokenValid(): boolean {
    // if (!this.accessToken) return of(false);
    if (!this.jwtPayload) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return this.jwtPayload.exp > currentTime;
    // return this.http.get<{ valid: boolean }>(`${this.backendUrl}/auth/validate-token`, {
    //   withCredentials: true
    // }).pipe(
    //   map(response => response.valid),
    //   catchError(() => of(false))
    // );
  }

  getAccessToken(): Observable<string | null> {
    if (this.accessToken && this._isTokenValid()) {
      return of(this.accessToken);
    } else {
      return this.refreshAccessToken();
    }
  }

  setToken(token: string): void {
    this.accessToken = token;
    this.accessTokenSubject.next(token);
    this._setJwtPayload(token);
  }

  clearToken(): void {
    this.accessToken = null;
    this.accessTokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.userRoleSubject.next(null);
    this.jwtPayload = null;
  }

  // adminLogin(username: string, password: string):Observable<any>{
  //   return this.http.post(`${this.backendUrl}/auth/admins/login`, {username, password},httpOptions);
  // }
  // adminRegister(adminData:any):Observable<any>{
  //   return this.http.post(`${this.backendUrl}/auth/admins/register`, adminData,httpOptions);
  // }
}
