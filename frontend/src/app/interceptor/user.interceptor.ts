import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, switchMap, catchError, throwError, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export const userAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('UserAuthInterceptor - Request URL:', req.url);

  if (
    req.url.startsWith('/auth/user/login') ||
    req.url.startsWith('/auth/refresh') ||
    req.url.startsWith('/auth/user/register') ||
    req.url.startsWith('/auth/user/verify-email') ||
    req.url.startsWith('/auth/google')
  ) {
    return next(req);
  }

  if (
    req.url.startsWith(`${environment.apiUrl}/user`) ||
    req.url.includes('/auth/user/logout') ||
    req.url.includes('/auth/user/theme-preference')
  ) {
    console.log('UserAuthInterceptor - Applying to:', req.url);
    const accessToken = authService.getAccessToken('User');
    console.log('UserAuthInterceptor - Access Token:', accessToken);

    if (!accessToken) {
      console.log('User session expired. Redirecting to login.');
      router.navigate(['/auth/login']);
      return EMPTY;
    }

    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    return next(clonedRequest).pipe(
      catchError((error) => {
        if (error.status === 401 && accessToken) {
          return authService.refreshAccessToken('User').pipe(
            tap((response) => console.log('New user token generated', response)),
            switchMap((response) => {
              authService.setAccessToken(response.accessToken, 'User');
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              console.error('Failed to refresh user token', refreshError);
              authService.logout('User');
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};