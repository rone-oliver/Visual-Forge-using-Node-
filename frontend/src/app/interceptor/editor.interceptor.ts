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

        const accessToken = authService.getAccessToken('User');
        console.log('EditorAuthInterceptor - Access Token:', accessToken);

        if (!accessToken) {
          console.log('EditorAuthInterceptor - No valid token found');
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
            if (error.status === 403 && error.error.isBlocked && accessToken) {
              console.error('User account is blocked. Logging out and redirecting.');
              authService.logout('User');
              router.navigate(['/auth/login'], {
                queryParams: { blocked: 'true' } // Ensure query param is a string
              });
              return EMPTY; // Stop further processing
            }
            
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
                  router.navigate(['/auth/user/login']);
                  return throwError(() => refreshError);
                })
              );
            }
            return throwError(() => error);
          })
        );

      })
    )
  }
  return next(req);
};