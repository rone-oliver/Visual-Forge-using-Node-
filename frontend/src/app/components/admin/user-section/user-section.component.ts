import { Component, OnInit } from '@angular/core';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { User, UserManagementService } from '../../../services/admin/user-management.service';
import { Observable } from 'rxjs';

// interface User {
//   id: string;
//   username: string;
//   email: string;
//   name: string;
//   gender: string;
//   age: number;
//   rating: string;
//   phone: string;
//   avatarUrl?: string;
//   isEditor?: boolean;
// }

@Component({
  selector: 'app-user-section',
  imports: [ProfileCardComponent, CommonModule, MatIconModule],
  templateUrl: './user-section.component.html',
  styleUrl: './user-section.component.scss'
})
export class UserSectionComponent implements OnInit {
  users$!: Observable<User[]>; 
  activeFilters: string[] = [];
  
  constructor(private userManagementService: UserManagementService) { }

  ngOnInit(): void {
    this.users$ = this.userManagementService.getAllUsers();
  }

  toggleFilter(filter: string): void {
    const index = this.activeFilters.indexOf(filter);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filter);
    }
  }
}
