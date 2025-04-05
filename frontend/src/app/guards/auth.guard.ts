import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { TokenService } from '../services/token.service';

export const userGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenService = inject(TokenService);

  const token = tokenService.getToken('User');
  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  const isTokenValid = authService.isAuthenticated('User');
  if (!isTokenValid) {
    try {
      // Try to refresh token
      await firstValueFrom(authService.refreshAccessToken('User'));
      return true;
    } catch (error) {
      // If refresh fails, clear auth state and redirect
      authService.logout('User').subscribe();
      router.navigate(['/auth/login']);
      return false;
    }
  }
  return true;
};

export const userLoginGuard: CanActivateFn = (route,state)=>{
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken('User');
  if(token){
    router.navigate(['/user'])
    return false;
  }
  return true;
}

export const adminLoginGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken('Admin');
  if (token) {
    router.navigate(['/admin/dashboard'])
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenService = inject(TokenService);

  const token = tokenService.getToken('Admin');
  if(!token){
    console.log('redirected when token is absent');
    router.navigate(['/auth/admin/login']);
    return false;
  }

  const isTokenValid = authService.isAuthenticated('Admin');
  if(!isTokenValid){
    try {
      await firstValueFrom(authService.refreshAccessToken('Admin'));
      return true;
    } catch (error) {
      authService.logout('Admin').subscribe();
    console.log('redirected when token is expired');
      router.navigate(['/auth/admin/login']);
      return false;
    }
  }
  return true;
}

export const editorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if(authService.isAuthenticated('User') && authService.hasRole('Editor', 'User')){
    return true;
  }

  if (authService.isAuthenticated('User')) {
    router.navigate(['/user']);
  } else {
    router.navigate(['/auth/login']);
  }
  return false;
}
