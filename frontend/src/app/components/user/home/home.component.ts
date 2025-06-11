import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
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
export class HomeComponent {
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
}
