import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  trendingWorks = [
    { id: 1, image: 'assets/trending1.jpg', editor: 'Chris Hartt', status: 'Verified' },
    { id: 2, image: 'assets/trending2.jpg', editor: 'Alex Morgan', status: 'Verified' },
    { id: 3, image: 'assets/trending3.jpg', editor: 'Jamie Wilson', status: 'Verified' },
    { id: 4, image: 'assets/trending4.jpg', editor: 'Taylor Reed', status: 'Verified' },
    { id: 5, image: 'assets/trending5.jpg', editor: 'Jordan Lee', status: 'Verified' },
    { id: 6, image: 'assets/trending6.jpg', editor: 'Casey Kim', status: 'Verified' },
    { id: 7, image: 'assets/trending7.jpg', editor: 'Riley Smith', status: 'Verified' },
    { id: 8, image: 'assets/trending8.jpg', editor: 'Quinn Johnson', status: 'Verified' }
  ];
  
  topEditors = [
    { id: 1, name: 'Mark Thompson', avatar: 'assets/avatar1.jpg', rating: 4.9 },
    { id: 2, name: 'Sarah Miller', avatar: 'assets/avatar2.jpg', rating: 4.8 },
    { id: 3, name: 'James Wilson', avatar: 'assets/avatar3.jpg', rating: 4.8 }
  ];
  
  countdown = {
    days: 7,
    hours: 18,
    minutes: 30,
    seconds: 45
  };
}
