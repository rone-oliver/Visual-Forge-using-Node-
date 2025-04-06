import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../services/admin/user-management.service';

// type User = {
//   username: string;
//   email: string;
//   name: string;
//   gender: string;
//   behaviourRating: string;
//   phone: string;
//   profileUrl: string;
// }

@Component({
  selector: 'app-profile-card',
  imports: [CommonModule,MatIconModule],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss'
})
export class ProfileCardComponent implements OnInit {
  @Input() user: Partial<User> = {};

  constructor() { }

  ngOnInit(): void {
    
  }
}
