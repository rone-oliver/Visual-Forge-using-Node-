import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const editorAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('EditorAuthInterceptor - Request URL:', req.url);

  if (req.url.startsWith(`${environment.apiUrl}/editor`)) {
    console.log('EditorAuthInterceptor - Applying to:', req.url);

    return authService.userRole$.pipe(
      take(1),
      switchMap(role => {
        console.log('EditorAuthInterceptor - User Role:', role);

        if(role !== 'Editor'){
          console.log('EditorAuthInterceptor - User is not an editor');
          router.navigate(['/user']);
          return EMPTY;
        }
        return next(req);
      })
    )
  }
  return next(req);
};