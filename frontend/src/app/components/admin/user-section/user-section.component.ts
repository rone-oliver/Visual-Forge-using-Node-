import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User, UserManagementService } from '../../../services/admin/user-management.service';
import { MatSelectModule } from '@angular/material/select';
import { TableColumn,TableComponent } from '../../shared/table/table.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-user-section',
  imports: [ReactiveFormsModule, TableComponent, FormsModule, MatSelectModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './user-section.component.html',
  styleUrl: './user-section.component.scss'
})
export class UserSectionComponent implements OnInit {
  searchQuery = '';
  searchControl = new FormControl();
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  activeFilters: string[] = [];
  private _hideEditors = false;
  selectedAge = '';
  selectedBehRating: number | null = null;
  selectedGender = '';

  // Pagination properties
  totalUsers = 0;
  currentPage = 1;
  pageSize = 10;

  // Sorting properties
  sortBy = 'fullname';
  sortOrder: 'asc' | 'desc' = 'asc';

  userColumns: TableColumn[] = [
    { key: 'fullname', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'username', header: 'Username', sortable: true},
    { key: 'mobileNumber', header: 'Phone', placeholder:'Not provided' },
    { key: 'gender', header: 'Gender', placeholder:'Not specified' },
    // { key: 'behaviourRating', header: 'Rating', sortable: true, placeholder:'Not Rated' },
    { key: 'isEditor', header: 'Editor Status', type: 'boolean' },
    { key: 'createdAt', header: 'Joined', type: 'date', sortable: true },
    { key: 'type', header: 'Actions', type: 'actions' }
  ];

  ageLabelMap: Record<string, string> = {
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
    this.searchControl.valueChanges
      .pipe(debounceTime(400))
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on search
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchControl.value || undefined
    };

    if (this.selectedGender) params.gender = this.selectedGender;
    if (this.selectedBehRating) params.behaviourRating = this.selectedBehRating;
    if (this._hideEditors) params.isEditor = false;

    this.userManagementService.getAllUsers(params).subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalUsers = response.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSortChange(sort: { key: string, direction: 'asc' | 'desc' }): void {
    this.sortBy = sort.key;
    this.sortOrder = sort.direction;
    this.currentPage = 1; // Reset to first page on sort
    this.loadUsers();
  }

  get hideEditors(): boolean {
    return this._hideEditors;
  }
  set hideEditors(value: boolean) {
    this._hideEditors = value;
  }
  
  onGenderChange() {
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'gender');
    setTimeout(() => this.loadUsers(), 400);
    // Optionally trigger filtering here
  }
  
  onBehRatingChange() {
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'behRating');
    // Optionally trigger filtering here
    setTimeout(() => this.loadUsers(), 400);
  }

  onHideEditorsChange(){
    setTimeout(() => this.loadUsers(), 400);
  }

  toggleFilter(filter: string): void {
    const index = this.activeFilters.indexOf(filter);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filter);
    }
  }

  selectAge(age: string) {
    this.selectedAge = age;
    // Optionally close the dropdown after selection:
    this.activeFilters = this.activeFilters.filter(f => f !== 'age');
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
