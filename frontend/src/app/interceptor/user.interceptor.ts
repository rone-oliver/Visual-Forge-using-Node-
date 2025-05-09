import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, switchMap, catchError, throwError, tap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export const userAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('UserAuthInterceptor - Request URL:', req.url);

  // Skip auth endpoints
  if (req.url.startsWith(`${environment.apiUrl}/auth`)) {
    return next(req);
  }

  if (
    req.url.startsWith(`${environment.apiUrl}/user`)) {
    console.log('UserAuthInterceptor - Applying to:', req.url);
    return authService.userRole$.pipe(
      take(1),
      switchMap(role => {
        if (!role || (role !== 'User' && role !== 'Editor')) {
          router.navigate(['/auth/login']);
          return EMPTY;
        }
        return next(req);
      })
    );
  }

  return next(req);
};