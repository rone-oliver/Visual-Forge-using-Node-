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

  if (req.url.startsWith(`${environment.apiUrl}/admin`)) {;
    const isLoginPage = window.location.href.includes('/auth/admin/login');
    if(!isLoginPage){
      return next(req);
    }
  }

  return next(req);
};