import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService, LoginResponse } from '../auth.service';
import { TokenService } from '../token.service';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _authService = inject(AuthService);
  private readonly _tokenService = inject(TokenService);

  private readonly _apiUrl = environment.apiUrl;
  private readonly _logger = inject(LoggerService);

  constructor() { };

  verifyGoogleToken(credential: string) {
    this._logger.info(`Verifying google token for`)
    return this._http.post<LoginResponse>(`${this._apiUrl}/auth/google`, { credential }, { withCredentials: true })
      .pipe(
        tap(response => {
          this._logger.info('Google token verified successfully, response:', response);
          this._authService.setAccessToken(response.accessToken, 'User');
        }),
        catchError(error => {
          this._tokenService.clearToken('User');
          return throwError(() => error);
        })
      );
  }
}
