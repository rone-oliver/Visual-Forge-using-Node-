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

        // Handle /editor routes (most specific)
        if (path.startsWith('/editor')) {
            return authService.userRole$.pipe(
                take(1),
                switchMap(role => {
                    console.log('TokenInterceptor - /editor route, User Role:', role);
                    if (role !== 'Editor') {
                        console.log('TokenInterceptor - User is not an editor. Redirecting.');
                        router.navigate(['/user']);
                        return EMPTY;
                    }
                    // Role is 'Editor', proceed to add token for 'User' type
                    return handleTokenAddition(req, next, 'User', authService, tokenService, router);
                })
            );
        }

        // Handle /user routes
        if (path.startsWith('/user')) {
            return authService.userRole$.pipe(
                take(1),
                switchMap(role => {
                    console.log('TokenInterceptor - /user route, User Role:', role);
                    if (!role || (role !== 'User' && role !== 'Editor')) {
                        console.log('TokenInterceptor - Invalid role for /user. Redirecting to login.');
                        router.navigate(['/auth/login']);
                        return EMPTY;
                    }
                    // Role is valid, proceed to add token for 'User' type
                    return handleTokenAddition(req, next, 'User', authService, tokenService, router);
                })
            );
        }

        // Handle /admin routes
        if (path.startsWith('/admin')) {
            return handleTokenAddition(req, next, 'Admin', authService, tokenService, router);
        }

        // Handle specific /auth routes that require a token (e.g., logout, refresh)
        if (
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
                    // Prioritize Admin if both are somehow authenticated.
                    const userType = isAdmin ? 'Admin' : 'User';
                    return handleTokenAddition(req, next, userType, authService, tokenService, router);
                })
            );
        }

        // For any other request that reaches here, pass it through without modification.
        return next(req);
    }
    return next(req);
};

function handleTokenAddition(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    userType: 'Admin' | 'User',
    authService: AuthService,
    tokenService: TokenService,
    router: Router,
) {
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
                    switchMap(() => EMPTY)
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
                            return handleLogout(userType, authService, router).pipe(
                                switchMap(() => EMPTY)
                            );
                        })
                    );
                } else {
                    console.error('Invalid token or other 401 error. Logging out.', error);
                    return handleLogout(userType, authService, router).pipe(
                        switchMap(() => EMPTY)
                    );
                }
            }

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