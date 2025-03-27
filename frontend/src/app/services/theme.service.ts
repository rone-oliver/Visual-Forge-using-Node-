import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkTheme.asObservable();
  constructor() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark);
  }

  setTheme(isDark: boolean):void{
    this.isDarkTheme.next(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }

  toggleTheme(){
    this.setTheme(!this.isDarkTheme.value);
  }
}
