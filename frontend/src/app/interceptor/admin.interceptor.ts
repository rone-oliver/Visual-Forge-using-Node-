import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AdminAuthInterceptor - Request URL:', req.url);

  if (req.url.startsWith('/auth/admin/login') ||
    req.url.startsWith('/auth/refresh') ||
    req.url.startsWith('/auth/google')
  ) {
    return next(req);
  }

  if (req.url.startsWith(`${environment.apiUrl}/admin`) ||
    req.url.includes('/auth/admin/logout')
    // req.url.includes('/auth/theme-preference')
  ) {
    console.log('AdminAuthInterceptor - Applying to:', req.url);
    const accessToken = authService.getAccessToken('Admin');
    console.log('AdminAuthInterceptor - Access Token:', accessToken);

    const isLoginPage = window.location.href.includes('/auth/admin/login');

    if (!accessToken && !isLoginPage) {
      console.log('Admin session expired. Redirecting to login.');
      router.navigate(['/auth/admin/login']);
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
          return authService.refreshAccessToken('Admin').pipe(
            tap((response) => console.log('New admin token generated', response)),
            switchMap((response) => {
              authService.setAccessToken(response.accessToken, 'Admin');
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              console.error('Failed to refresh admin token', refreshError);
              authService.logout('Admin');
              router.navigate(['/auth/admin/login']);
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