import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { UserFooterComponent } from '../../../components/user/user-footer/user-footer.component';
import { UserHeaderComponent } from '../../../components/user/user-header/user-header.component';
import { Subscription } from 'rxjs';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, UserHeaderComponent, UserFooterComponent, MediaProtectionDirective],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggered', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('700ms 300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LandingPageComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  trendingWorks = [
    { id: 1, image: 'https://placehold.co/600x400', editor: 'Chris Hartt', status: 'Verified' },
    { id: 2, image: 'https://placehold.co/600x400', editor: 'Alex Morgan', status: 'Verified' },
    { id: 3, image: 'https://placehold.co/600x400', editor: 'Jamie Wilson', status: 'Verified' },
    { id: 4, image: 'https://placehold.co/600x400', editor: 'Taylor Reed', status: 'Verified' },
    { id: 5, image: 'https://placehold.co/600x400', editor: 'Jordan Lee', status: 'Verified' },
    { id: 6, image: 'https://placehold.co/600x400', editor: 'Casey Kim', status: 'Verified' },
    { id: 7, image: 'https://placehold.co/600x400', editor: 'Riley Smith', status: 'Verified' },
    { id: 8, image: 'https://placehold.co/600x400', editor: 'Quinn Johnson', status: 'Verified' }
  ];
  
  topEditors = [
    { id: 1, name: 'Mark Thompson', avatar: 'https://placehold.co/400/orange/white', rating: 4.9 },
    { id: 2, name: 'Sarah Miller', avatar: 'https://placehold.co/400/orange/white', rating: 4.8 },
    { id: 3, name: 'James Wilson', avatar: 'https://placehold.co/400/orange/white', rating: 4.8 }
  ];
  
  countdown = {
    days: 7,
    hours: 18,
    minutes: 30,
    seconds: 45
  };
  private themeSubscription!: Subscription
  
  constructor(
    private themeService: ThemeService,
  ) {}
  
  ngOnInit(): void {
    this.themeSubscription = this.themeService.isUserDarkTheme$.subscribe(
      isDark => {
        this.isDarkMode=isDark;
        document.documentElement.classList.toggle('dark', isDark);
      }
    );
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.themeService.setTheme(prefersDark,'User');
  }

  ngOnDestroy(): void {
    if(this.themeSubscription){
      this.themeSubscription.unsubscribe();
    }
  }
  
  toggleDarkMode(): void {
    // this.isDarkMode = !this.isDarkMode;
    this.themeService.toggleTheme();
  }
}
