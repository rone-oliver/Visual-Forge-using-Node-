// sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

@Component({
  selector: 'app-sidebar',
  imports:[MatIconModule,RouterModule,CommonModule, MediaProtectionDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isDarkTheme$!: Observable<boolean>;
  activeTab: string | null = null;
  
  menuItems = [
    { icon: 'dashboard', text: 'Dashboard', link: '/dashboard' },
    { icon: 'edit', text: 'Editors', link: '/editors' },
    { icon: 'people', text: 'Users', link: '/users' },
    { icon: 'code', text: 'Programs', link: '/programs' },
    { icon: 'admin_panel_settings', text: 'Admin Activities', link: '/admin-activities' },
    { icon: 'report', text: 'Reported Users', link: '/reported-users' }
  ];
  
  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.isDarkTheme$ = this.themeService.isAdminDarkTheme$;
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(){
    this.authService.logout('Admin').subscribe({
      next: () => {
        this.router.navigate(['/auth/admin/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }

  toggleFilter(tab: string): void {
    this.activeTab = tab;
  }
}