import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { combineLatest, Subscription} from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
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
    this.authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
    });
    this.authService.userRole$.subscribe(role=>{
      this.userRole = role;
    })
  };

  ngOnInit() {
    // Subscribe to authentication changes
    // this.authSubscription = combineLatest([
    //   this.authService.isAuthenticated$,
    //   this.authService.userRole$
    // ]).subscribe(([isAuthenticated, getUserRole]) => {
    //   this.isAuthenticated = isAuthenticated;
    //   this.userRole = getUserRole;
    //   // this.updateHeaderUI();
    // });
    // console.log(this.userRole);

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
    this.authService.logout('User').subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }
}
