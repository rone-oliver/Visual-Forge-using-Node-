import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, of, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';

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
  // private accessToken: string | null = null;
  // private jwtPayload: JwtPayload | null = null;
  // private userRole!: string;
  // private accessTokenSubject = new BehaviorSubject<string | null>(null);
  // accessToken$ = this.accessTokenSubject.asObservable();

  // private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  // isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  // private userRoleSubject = new BehaviorSubject<string | null>(this.getUserRole());
  // userRole$ = this.userRoleSubject.asObservable();

  // // User subjects
  // private userAccessTokenSubject = new BehaviorSubject<string | null>(null);
  // userAccessToken$ = this.userAccessTokenSubject.asObservable();

  private userIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  userIsAuthenticated$ = this.userIsAuthenticatedSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(null);
  userRole$ = this.userRoleSubject.asObservable();

  // // Admin subjects
  // private adminAccessTokenSubject = new BehaviorSubject<string | null>(null);
  // adminAccessToken$ = this.adminAccessTokenSubject.asObservable();

  private adminIsAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  adminIsAuthenticated$ = this.adminIsAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient,private tokenService: TokenService) {
    // this.loadAccessToken().catch((error)=>{
    //   console.log("response from check-refreshToken failed",error);
    //   this.clearToken();
    // });

    // if(this.accessToken){
    //   this.isAuthenticatedSubject.next(true);
    //   this.userRoleSubject.next(this.jwtPayload?.role || null);
    // }
    this.initializeAuth();
  };

  private initializeAuth():void{
    const userToken = this.tokenService.getToken('User');
    if(userToken){
      this.userIsAuthenticatedSubject.next(true);
      this.setRole(userToken,'User');
    }

    const adminToken = this.tokenService.getToken('Admin');
    if(adminToken){
      this.adminIsAuthenticatedSubject.next(true);
      // this.setRole(adminToken,'Admin');
    }
  }

  private setRole(token:string,userType:'User' | 'Admin'){
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (userType === 'User') {
        this.userRoleSubject.next(payload.role);
      }
    } catch (error) {
      console.error('Unable to decode token')
    }
  }
  
  // private async loadAccessToken(userType: 'User' | 'Admin'): Promise<void> {
  //   console.log("load access Token triggered");
  //   try {
  //     const token = this.tokenService.getToken(userType);
  //     if (!token) {
  //       this.clearToken();
  //       return;
  //     }
  //     const response = await firstValueFrom(
  //       this.http.get<{ valid: boolean }>(`${this.backendUrl}/auth/check-refreshToken`, {
  //         withCredentials: true
  //       })
  //     );
  
  //     if (!response.valid) {
  //       console.log("response from check-refreshToken",response.valid);
  //       this.clearToken();
  //       return;
  //     }
  
  //   } catch {
  //     console.log('Load access token failed');
  //     this.clearToken();
  //   }
  // }

  getAccessToken(userType: 'User' | 'Admin'): string | null{
    const token = this.tokenService.getToken(userType);
    if (token && this._isTokenValid(token)) {           // Is there a need to check validity separately?
      return token;
    }
    return null;
  }

  setAccessToken(token: string, userType: 'User' | 'Admin'): void {
    // this.accessToken = token;
    // this.accessTokenSubject.next(token);
    // sessionStorage.setItem('accessToken', token);
    this.tokenService.setToken(token,userType);
    if (userType === 'User') {
      // this.userAccessTokenSubject.next(token);
      this.userIsAuthenticatedSubject.next(this._isTokenValid(token));
      this.setRole(token, 'User');
    } else {
      // this.adminAccessTokenSubject.next(token);
      this.adminIsAuthenticatedSubject.next(this._isTokenValid(token));
      this.setRole(token, 'Admin');
    }
    // this._setJwtPayload(token);
    // this.isAuthenticatedSubject.next(this._isTokenValid(token));
    // this.userRoleSubject.next(this.jwtPayload?.role || null);
  }

  logout(userType: 'User' | 'Admin'):Observable<any>{
    const endpoint = userType === 'User' ? 'user/logout' : 'admin/logout';
    const token = this.tokenService.getToken(userType);
    return this.http.post(`${this.backendUrl}/auth/${endpoint}`,{}, { 
      // headers: {
      //   Authorization: `Bearer ${token}`
      // },
      withCredentials: true})
    .pipe(
      tap(() => {
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
      }),
      catchError(error => {
        console.error('Logout failed:', error);
        return throwError(() => error);
      })
    );
  }
  
  refreshAccessToken(userType: 'User' | 'Admin'): Observable<{accessToken: string, userType:UserType}> {
    return this.http.get<{ accessToken: string, userType:UserType }>(`${this.backendUrl}/auth/refresh`, {
      withCredentials: true,
      params: new HttpParams().set('role', userType)
    }).pipe(
      map(response => {
        this.setAccessToken(response.accessToken, userType);
        return {accessToken:response.accessToken,userType};
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.tokenService.clearToken(userType);
        // this.clearToken();
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginCredentials,userType: UserType): Observable<LoginResponse>{
    const loginEndpoint = userType === 'Admin' 
      ? `${this.backendUrl}/auth/admin/login`
      : `${this.backendUrl}/auth/user/login`;

    return this.http.post<LoginResponse>(loginEndpoint, credentials, {withCredentials:true})
    .pipe(
      tap(response => {
        // this.accessToken = response.accessToken;
        // this.accessTokenSubject.next(response.accessToken);
        // this.userRoleSubject.next(this.jwtPayload?.role || null);
        // this._setJwtPayload(response.accessToken);
        // this.isAuthenticatedSubject.next(true);
        this.setAccessToken(response.accessToken,userType);
      }),
      catchError(error => {
        this.tokenService.clearToken(userType);
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

  private extractJwtPayload(token:string){
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Unable to decode the token',error);
      throw new Error;
    }
  }

  private _isTokenValid(token: string): boolean {
    // if (!this.accessToken) return of(false);
    // console.log("jwt payload from _isTokenValid fn",this.jwtPayload);
    // if (!this.jwtPayload) return false;
    const jwtPayload = this.extractJwtPayload(token);
    const currentTime = Math.floor(Date.now() / 1000);
    // alert(`is jwt expired? ${jwtPayload.exp<currentTime}`)
    return jwtPayload.exp > currentTime;
  }

  isAuthenticated(userType: 'User' | 'Admin'): boolean {
    alert(this.tokenService.getToken(userType));
    const token = this.tokenService.getToken(userType);
    if (!token) return false;
    return this._isTokenValid(token);
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

  // getUserRole(): string | null {
  //   return this.jwtPayload?.role || null;
  // }

  // Not finished
  // private _setJwtPayload(accessToken: string): JwtPayload | null {
  //   try {
  //     this.jwtPayload = jwtDecode<JwtPayload>(accessToken);
  //     return this.jwtPayload;
  //   } catch (error) {
  //     this.jwtPayload = null;
  //     return null;
  //   }
  // }

  // getAccessToken(): Observable<string | null> {
  //   if (this.accessToken && this._isTokenValid()) {
  //     return of(this.accessToken);
  //   } else {
  //     return this.refreshAccessToken();
  //   }
  // }
  // private clearToken(): void {
  //   this.accessToken = null;
  //   this.jwtPayload = null;
  //   // this.userRole = null;
  //   this.accessTokenSubject.next(null);
  //   this.isAuthenticatedSubject.next(false);
    // this.userRoleSubject.next(null);
  // }
}
