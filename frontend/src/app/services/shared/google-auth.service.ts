import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService, LoginResponse } from '../auth.service';
import { TokenService } from '../token.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService,
  ) { }

  private apiUrl = environment.apiUrl;

  verifyGoogleToken(credential: string) {
    console.log(`verifying google token for`)
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/google`, { credential }, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('Google token verified successfully, response:', response);
          this.authService.setAccessToken(response.accessToken, 'User');
        }),
        catchError(error => {
          this.tokenService.clearToken('User');
          return throwError(() => error);
        })
      );
  }
}
