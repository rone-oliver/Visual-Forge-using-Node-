import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { catchError, combineLatest, EMPTY, from, map, Observable, switchMap, take, tap, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    console.log('TokenAuthInterceptor - Request URL:', req.url);

    if (req.url.startsWith(`${environment.apiUrl}/auth`) &&
        !req.url.includes('/logout') &&
        // !req.url.includes('/refresh') &&             Infinite loop condition when not commented
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
                    return handleTokenAddition(req, next, userType, authService, tokenService, router);
                })
            );
        } else {
            // If not an admin or user route, pass through without token
            return next(req);
        }
        return handleTokenAddition(req, next, userType, authService, tokenService, router);
    }
    return next(req);
};

function handleTokenAddition(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    userType: 'Admin' | 'User',
    authService: AuthService,
    tokenService: TokenService,
    router: Router) {
    const accessToken = tokenService.getToken(userType);

    let requestToHandle = req;
    if (accessToken) {
        requestToHandle = req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        });
    }

    return next(requestToHandle).pipe(
        catchError((error) => {
            console.error('Error occurred in TokenAuthInterceptor:', error);

            if (error.status === 403 && error.error?.isBlocked) {
                console.log('User is blocked. Logging out.');
                return handleLogout(userType, authService, router, { blocked: 'true' }).pipe(
                    switchMap(() => EMPTY) // Stop the request chain
                );
            }

            if (error.status === 401) {
                if (error.error.isTokenExpired) {
                    console.log('Access token expired. Attempting to refresh.');
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
                            console.error(`Failed to refresh ${userType} token. Logging out.`, refreshError);
                            // Logout and then stop the request chain.
                            return handleLogout(userType, authService, router).pipe(
                                switchMap(() => EMPTY)
                            );
                        })
                    );
                } else {
                    // Handle other 401 errors (e.g., invalid token) by logging out and stopping the chain.
                    console.error('Invalid token or other 401 error. Logging out.', error);
                    return handleLogout(userType, authService, router).pipe(
                        switchMap(() => EMPTY)
                    );
                }
            }

            // For all other errors, just re-throw
            return throwError(() => error);
        })
    );
}

function handleLogout(userType: 'User' | 'Admin' | null, authService: AuthService, router: Router, queryParams = {}): Observable<any> {
    const effectiveUserType = userType || 'User';
    console.log(`Handling logout for ${effectiveUserType}`);

    return authService.logout(effectiveUserType).pipe(
        tap({
            next: () => console.log(`Logout successful for ${effectiveUserType}`),
            error: (err) => console.error(`Logout API call failed for ${effectiveUserType}`, err),
        }),
        finalize(() => {
            console.log(`Navigating to login page for ${effectiveUserType}`);
            const path = effectiveUserType === 'Admin' ? '/auth/admin/login' : '/auth/login';
            router.navigate([path], { queryParams });
        })
    );
}