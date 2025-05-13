import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { catchError, combineLatest, EMPTY, from, map, switchMap, take, tap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('TokenAuthInterceptor - Request URL:', req.url);

    if (req.url.startsWith(`${environment.apiUrl}/auth`) &&
        !req.url.includes('/logout') &&
        // !req.url.includes('/refresh') &&         I think there is no need to check for refresh token
        !req.url.includes('/theme-preference')) {
        return next(req);
    }
    console.log('TokenAuthInterceptor - Applying to:', req.url);
    // if (authService.isRefreshInProgress() && req.url.includes('/refresh')) {
    //     return next(req);
    // }

    if (req.url.startsWith(environment.apiUrl)) {
        // Get the path after the API URL
        const path = req.url.substring(environment.apiUrl.length);

        // Determine user type based on URL path
        let userType: 'Admin' | 'User';
        if (path.startsWith('/admin')) {
            userType = 'Admin';
        } else if (path.startsWith('/user')) {
            userType = 'User';
        } else if (path.startsWith('/editor')) {
            userType = 'User';
        } else if (
            path.startsWith('/auth/logout') ||
            path.startsWith('/auth/refresh') ||
            path.startsWith('/auth/theme-preference')
        ) {
            return combineLatest([
                authService.adminIsAuthenticated$,
                authService.userIsAuthenticated$
            ]).pipe(
                take(1),
                switchMap(([isAdmin, isUser]) => {
                    userType = isAdmin ? 'Admin' : 'User';
                    return handleTokenAddition(req, next, userType, authService, router);
                })
            );
        } else {
            // If not an admin or user route, pass through without token
            return next(req);
        }
        return handleTokenAddition(req, next, userType, authService, router);
    }
    return next(req);
};

function handleTokenAddition(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    userType: 'Admin' | 'User',
    authService: AuthService,
    router: Router) {
    const accessToken = authService.getAccessToken(userType);

    if (!accessToken) {
        router.navigate([userType === 'Admin' ? '/auth/admin/login' : '/auth/login']);
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
            console.error('Error occurred in TokenAuthInterceptor:', error);
            if (error.status === 403 && error.error?.isBlocked) {
                authService.logout(userType);
                userType !== 'Admin' ? router.navigate(['/auth/login'], {
                    queryParams: { blocked: 'true' }
                }) : router.navigate(['/auth/admin/login'], {
                    queryParams: { blocked: 'true' }
                });
                return EMPTY;
            }

            if (error.status === 401) {
                return authService.refreshAccessToken(userType).pipe(
                    tap((response) => console.log(`New ${userType} token generated: `, response)),
                    switchMap((response) => {
                        authService.setAccessToken(response.accessToken, userType);
                        const newReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${response.accessToken}`,
                            },
                        });
                        return next(newReq);
                    }),
                    catchError((refreshError) => {
                        console.error(`Failed to refresh ${userType} token`, refreshError);
                        return from(
                            Promise.resolve(authService.logout(userType)) // Assuming logout returns Promise or void
                                .then(() => {
                                    // Navigate after logout attempt
                                    userType !== 'Admin' ? router.navigate(['/auth/login']) : router.navigate(['/auth/admin/login']);
                                })
                                .catch(logoutNavError => {
                                    // Log error during logout/nav but proceed to throw original refreshError
                                    console.error(`Error during logout/navigation after ${userType} token refresh failure:`, logoutNavError);
                                })
                        ).pipe(
                            // After the logout/navigation attempts, switch to an observable that throws the refreshError
                            switchMap(() => throwError(() => refreshError))
                        );
                    })
                );
            }
            return throwError(() => error);
        })
    );
}