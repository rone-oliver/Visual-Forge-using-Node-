import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, delay, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDarkTheme = new BehaviorSubject<boolean>(false);
  private _isAdminTheme = new BehaviorSubject<boolean>(false);

  isUserDarkTheme$ = this._isDarkTheme.asObservable();
  isAdminDarkTheme$ = this._isAdminTheme.asObservable();

  private _backendUrl = environment.apiUrl;

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _authService = inject(AuthService);
  private readonly _logger = inject(LoggerService);

  constructor() {
    this._authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this._loadDefaultTheme('User');
      } else {
        this._loadSavedTheme('User');
      }
    });

    this._authService.adminIsAuthenticated$.pipe(delay(100)).subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this._loadDefaultTheme('Admin');
      } else {
        this._loadSavedTheme('Admin');
      }
    });
  }

  private _loadDefaultTheme(role: 'User' | 'Admin'): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark, role);
  }

  private async _loadSavedTheme(role: 'User' | 'Admin'): Promise<void> {
    try {
      this._logger.info('Load saved theme called');
      const response = await firstValueFrom(
        this._http.get<{ isDark: boolean }>(`${this._backendUrl}/auth/theme-preference?userType=${role}`, {
          withCredentials: true, observe:'response' as const
        })
      );
      if (response.status === 404) {
        this._logger.warn('Theme preference not found, loading default theme');
        this._loadDefaultTheme(role);
      } else if(response.body) {
        this.setTheme(response.body.isDark, role);
      }
    } catch (error) {
      this._logger.error('Failed to load theme preference:', error);
      this._loadDefaultTheme(role);
    }
  }

  public setTheme(isDark: boolean, role: 'User' | 'Admin'): void {
    if (role === 'User') {
      this._isDarkTheme.next(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      this._isAdminTheme.next(isDark);
      document.documentElement.classList.toggle('admin-dark', isDark);
    }
  }

  toggleTheme(): void {
    const isDark = !this._isDarkTheme.value;
    this.setTheme(isDark, 'User');
    this._saveThemePreference(isDark, 'User');
  }

  toggleAdminTheme(): void {
    const isDark = !this._isAdminTheme.value;
    this.setTheme(isDark, 'Admin');
    this._saveThemePreference(isDark, 'Admin');
  }

  private async _saveThemePreference(isDark:boolean,role: 'User' | 'Admin'):Promise<void>{
    try {
      await firstValueFrom(
        this._http.put(`${this._backendUrl}/auth/theme-preference`, {
          userType:role,
          isDark
        }, {
          withCredentials: true
        })
      );
    } catch (error) {
      this._logger.error('Failed to save theme preference: ',error);
    }
  }
}