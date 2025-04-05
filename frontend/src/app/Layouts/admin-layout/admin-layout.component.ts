import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/admin/sidebar/sidebar.component';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy{
  private themeSubscription!: Subscription;
  constructor(public themeService: ThemeService){};
  ngOnInit() {
    this.themeSubscription = this.themeService.isAdminDarkTheme$.subscribe(isDark => {
      console.log('Admin theme changed to dark:', isDark);
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
