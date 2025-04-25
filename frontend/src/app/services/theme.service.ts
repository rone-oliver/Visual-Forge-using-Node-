import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, delay, firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  private isAdminTheme = new BehaviorSubject<boolean>(false);

  isUserDarkTheme$ = this.isDarkTheme.asObservable();
  isAdminDarkTheme$ = this.isAdminTheme.asObservable();

  private backendUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.loadDefaultTheme('User');
      } else {
        this.loadSavedTheme('User');
      }
    });

    this.authService.adminIsAuthenticated$.pipe(delay(100)).subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.loadDefaultTheme('Admin');
      } else {
        console.log('called the constructor');
        this.loadSavedTheme('Admin');
      }
    });
  }

  private loadDefaultTheme(role: 'User' | 'Admin'): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark, role);
  }

  private async loadSavedTheme(role: 'User' | 'Admin'): Promise<void> {
    try {
      console.log('load saved theme called');
      const response = await firstValueFrom(
        this.http.get<{ isDark: boolean }>(`${this.backendUrl}/auth/${role.toLowerCase()}/theme-preference?userType=${role}`, {
          withCredentials: true, observe:'response' as const
        })
      );
      if (response.status === 404) {
        console.log('Theme preference not found, loading default theme');
        this.loadDefaultTheme(role);
      } else if(response.body) {
        this.setTheme(response.body.isDark, role);
        // localStorage.setItem(`${role.toLowerCase()}-theme`, response.body.isDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      this.loadDefaultTheme(role);
    }
  }

  public setTheme(isDark: boolean, role: 'User' | 'Admin'): void {
    if (role === 'User') {
      this.isDarkTheme.next(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      this.isAdminTheme.next(isDark);
      document.documentElement.classList.toggle('admin-dark', isDark);
    }
  }

  toggleTheme(): void {
    const isDark = !this.isDarkTheme.value;
    this.setTheme(isDark, 'User');
    this.saveThemePreference(isDark, 'User');
  }

  toggleAdminTheme(): void {
    const isDark = !this.isAdminTheme.value;
    this.setTheme(isDark, 'Admin');
    this.saveThemePreference(isDark, 'Admin');
  }

  private async saveThemePreference(isDark:boolean,role: 'User' | 'Admin'):Promise<void>{
    try {
      await firstValueFrom(
        this.http.post(`${this.backendUrl}/auth/${role.toLowerCase()}/theme-preference`, {
          userType:role,
          isDark
        }, {
          withCredentials: true
        })
      );
      // localStorage.setItem(`${role.toLowerCase()}-theme`, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference: ',error);
    }
  }
}