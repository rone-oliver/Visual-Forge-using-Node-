import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { combineLatest, Subscription, take } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-header.component.html',
  styleUrl: './user-header.component.scss'
})
export class UserHeaderComponent implements OnInit, OnDestroy{
  isAuthenticated = false;
  userRole: string | null = null;
  private authSubscription!: Subscription;
  // private themeSubscription!: Subscription;
  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ){
    // this.themeService.isDarkTheme$.pipe(take(1)).subscribe(isDark => {
    //   document.documentElement.classList.toggle('dark', isDark);
    // });
  };

  ngOnInit() {
    // Subscribe to authentication changes
    this.authSubscription = combineLatest([
      this.authService.isAuthenticated$,
      this.authService.userRole$
    ]).subscribe(([isAuthenticated, role]) => {
      this.isAuthenticated = isAuthenticated;
      this.userRole = role;
      // this.updateHeaderUI();
    });

    // this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
    //   document.documentElement.classList.toggle('dark', isDark);
    // });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    // if (this.themeSubscription) {
    //   this.themeSubscription.unsubscribe();
    // }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
