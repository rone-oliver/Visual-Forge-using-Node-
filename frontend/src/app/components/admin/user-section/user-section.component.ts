import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { User, UserManagementService } from '../../../services/admin/user-management.service';
import { Observable } from 'rxjs';
import { TableColumn,TableComponent } from '../../shared/table/table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-section',
  imports: [TableComponent, FormsModule, CommonModule, MatIconModule],
  templateUrl: './user-section.component.html',
  styleUrl: './user-section.component.scss'
})
export class UserSectionComponent implements OnInit {
  searchQuery: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = true;
  activeFilters: string[] = [];

  userColumns: TableColumn[] = [
    { key: 'fullname', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'gender', header: 'Gender' },
    { key: 'age', header: 'Age', sortable: true },
    { key: 'rating', header: 'Rating', sortable: true },
    { key: 'isEditor', header: 'Editor Status', type: 'boolean' },
    { key: 'createdAt', header: 'Joined', type: 'date', sortable: true },
    { key: 'type', header: 'Actions', type: 'actions' }
  ];
  
  constructor(private userManagementService: UserManagementService) { }

  ngOnInit(): void {
    // this.users$ = this.userManagementService.getAllUsers();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userManagementService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  get displayUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.users;
    }
    
    const query = this.searchQuery.toLowerCase().trim();
    return this.users.filter(user => {
      return (
        (user.fullname && user.fullname.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
    });
  }

  toggleFilter(filter: string): void {
    const index = this.activeFilters.indexOf(filter);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filter);
    }
  }

  onUserClick(user: any) {
    console.log('User clicked:', user);
  }

  onUserAction(event: {action: string, item: any}) {
    console.log(`${event.action} clicked for:`, event.item);
  }
}
