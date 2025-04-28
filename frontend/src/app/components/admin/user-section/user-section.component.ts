import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User, UserManagementService } from '../../../services/admin/user-management.service';
import { MatSelectModule } from '@angular/material/select';
import { TableColumn,TableComponent } from '../../shared/table/table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-section',
  imports: [TableComponent, FormsModule, MatSelectModule, CommonModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './user-section.component.html',
  styleUrl: './user-section.component.scss'
})
export class UserSectionComponent implements OnInit {
  searchQuery: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = true;
  activeFilters: string[] = [];
  private _hideEditors: boolean = false;
  selectedAge: string = '';
  selectedBehRating: number | null = null;
  selectedGender: string = '';

  userColumns: TableColumn[] = [
    { key: 'fullname', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'username', header: 'Username', sortable: true},
    { key: 'mobileNumber', header: 'Phone', placeholder:'Not provided' },
    { key: 'gender', header: 'Gender', placeholder:'Not specified' },
    { key: 'behaviourRating', header: 'Rating', sortable: true, placeholder:'Not Rated' },
    { key: 'isEditor', header: 'Editor Status', type: 'boolean' },
    { key: 'createdAt', header: 'Joined', type: 'date', sortable: true },
    { key: 'type', header: 'Actions', type: 'actions' }
  ];

  ageLabelMap: { [key: string]: string } = {
    below18: 'Below 18',
    '18to30': 'Between 18 and 30',
    '30to60': 'Between 30 and 60',
    above60: 'Above 60'
  };
  
  constructor(
    private userManagementService: UserManagementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // this.users$ = this.userManagementService.getAllUsers();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userManagementService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        // this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  get displayUsers(): User[] {
    const query = this.searchQuery.toLowerCase().trim();
    return this.users.filter(user => {
      return (
        ((user.fullname && user.fullname.toLowerCase().trim().includes(query)) ||
        (user.email && user.email.toLowerCase().trim().includes(query))) && 
        ( this.hideEditors ? !user.isEditor : true)
      );
    });
  }

  get hideEditors(): boolean {
    return this._hideEditors;
  }
  set hideEditors(value: boolean) {
    this._hideEditors = value;
    // Optionally trigger change detection if needed
  }

  toggleFilter(filter: string): void {
    const index = this.activeFilters.indexOf(filter);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filter);
    }
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'gender');
    // Optionally trigger filtering here
  }

  selectAge(age: string) {
    this.selectedAge = age;
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'age');
    // Optionally trigger filtering here
  }

  selectBehRating(rating: number) {
    this.selectedBehRating = rating;
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'behRating');
    // Optionally trigger filtering here
  }

  onUserClick(user: any) {
    console.log('User clicked:', user);
  }

  onUserAction(event: {action: string, item: any}) {
    console.log(`${event.action} clicked for:`, event.item);
    if(event.action === 'block'){
      this.blockUser(event.item);
    }
  }

  blockUser(user: User):void{
    this.userManagementService.blockUser(user._id).subscribe({
      next:(response)=>{
        this.loadUsers();
      },
      error:(error)=>{
        console.error('Error blocking user:', error);
      }
    });
  }
}
