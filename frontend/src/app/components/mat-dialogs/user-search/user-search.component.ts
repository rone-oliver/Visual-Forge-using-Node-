import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../services/user/user.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

export interface User {
  _id: string;
  username: string;
  profileImage?: string;
  email: string;
  isOnline?: boolean;
}

export interface UserSearchDialogData {
  title?: string;
  excludeUserIds?: string[];
}

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MediaProtectionDirective,
  ],
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = '';
  isLoading = false;
  searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<UserSearchComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserSearchDialogData,
    private usersService: UserService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterUsers(query);
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private filterUsers(query: string): void {
    if (!query.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) || 
      user.email.toLowerCase().includes(lowerQuery)
    );
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.usersService.getUsers().subscribe({
      next: (users) => {
        // Filter out excluded users if any
        if (this.data.excludeUserIds && this.data.excludeUserIds.length > 0) {
          this.users = users.filter(user => !this.data.excludeUserIds?.includes(user._id));
        } else {
          this.users = users;
        }
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  selectUser(user: User): void {
    this.dialogRef.close(user);
  }

  sendHi(user: User, event: Event): void {
    event.stopPropagation(); // Prevent the row click from triggering
    this.dialogRef.close({ user, action: 'sendHi' });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  close(): void {
    this.dialogRef.close();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
