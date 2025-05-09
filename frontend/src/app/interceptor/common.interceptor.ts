import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const commonInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    if (req.url.includes('/auth/logout') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/theme-preference')) {
        return next(req);
    }

    return next(req);
};