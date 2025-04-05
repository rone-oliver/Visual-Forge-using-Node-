import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  private isAdminTheme = new BehaviorSubject<boolean>(false);

  isUserDarkTheme$ = this.isDarkTheme.asObservable();
  isAdminDarkTheme$ = this.isAdminTheme.asObservable();

  private backendUrl = 'http://localhost:5000';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // this.setTheme(prefersDark);
    this.authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.loadDefaultTheme('User');
      } else {
        this.loadSavedTheme('User');
      }
    });

    this.authService.adminIsAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.loadDefaultTheme('Admin');
      } else {
        this.loadSavedTheme('Admin');
      }
    });
  }

  // setTheme(isDark: boolean):void{
  //   this.isDarkTheme.next(isDark);
  //   document.documentElement.classList.toggle('dark', isDark);
  // }

  // toggleTheme(){
  //   this.setTheme(!this.isDarkTheme.value);
  // }

  // New implementations

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
        localStorage.setItem(`${role.toLowerCase()}-theme`, response.body.isDark ? 'dark' : 'light');
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
      localStorage.setItem(`${role.toLowerCase()}-theme`, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference: ',error);
    }
  }
}

// export class AdminThemeService{
//   private isDarkTheme = new BehaviorSubject<boolean>(false);
//   isDarkTheme$ = this.isDarkTheme.asObservable();

//   constructor() {
//     this.loadTheme();
//   }

//   toggleTheme(): void {
//     const isDark = !this.isDarkTheme.value;
//     this.isDarkTheme.next(isDark);
//     this.saveTheme(isDark);
//   }

//   private saveTheme(isDark: boolean): void {
//     localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
//     document.documentElement.setAttribute('data-admin-theme', isDark ? 'dark' : 'light');
//   }

//   private loadTheme(): void {
//     const savedTheme = localStorage.getItem('admin-theme');
//     const isDark = savedTheme === 'dark';
//     this.isDarkTheme.next(isDark);
//     document.documentElement.setAttribute('data-admin-theme', isDark ? 'dark' : 'light');
//   }
// }
