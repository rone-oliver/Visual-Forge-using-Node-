import { Component, OnInit } from '@angular/core';

import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Activity, Hourglass, LucideAngularModule, Zap } from 'lucide-angular';
import { Search, Funnel, ChevronDown, ShareIcon, Plus, Clock, Star, X, X as XIcon, Check } from 'lucide-angular';
import { EditorRequest } from '../../../interfaces/user.interface';
import { EditorManagementService } from '../../../services/admin/editor-management.service';
import { DatePipe } from '../../../pipes/date.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableColumn, TableComponent } from '../../shared/table/table.component';
import { MatIconModule } from '@angular/material/icon';
import { Editor } from '../../../interfaces/editor.interface';
import { debounceTime } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-editor-section',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    LucideAngularModule,
    DatePipe,
    TableComponent
],
  templateUrl: './editor-section.component.html',
  styleUrl: './editor-section.component.scss'
})
export class EditorSectionComponent implements OnInit {
  searchControl = new FormControl('');
  categoryFilterControl = new FormControl<string[]>([]);
  ratingFilterControl = new FormControl(0);
  
  searchQuery: string = '';
  
  // Sidebar visibility state
  sidebarVisible = false;
  
  // Request being reviewed (for rejection reason)
  currentRequest: EditorRequest | null = null;
  rejectionReason = '';

  // Editor requests data
  editorRequests: EditorRequest[] = [];
  editors: Editor[] = [];

  loading: boolean = false;

  constructor(
    private editorManagementService: EditorManagementService,
  ) { };

  ngOnInit(): void {
    this.loadEditorRequests();
    this.loadEditors();
    this.searchControl.valueChanges
      .pipe(debounceTime(400))
      .subscribe(value => {
        this.searchQuery = value || '';
        this.loadEditors();
      });
  }

  loadEditorRequests(): void {
    this.editorManagementService.getEditorRequests().subscribe({
      next: (requests) => {
        this.editorRequests = requests;
      },
      error: (error) => {
        console.error('Error fetching editor requests:', error);
      }
    });
  }

  onFilterChange(): void {
    this.loadEditors();
  }

  loadEditors() {
    const params: any = {};
    
    // Search filter
    if(this.searchQuery.trim()) params.search = this.searchQuery.trim();
    
    // Category filters
    const selectedCategories = this.categoryFilterControl.value || [];
    if(selectedCategories.includes('audio')) params.audio = true;
    if(selectedCategories.includes('image')) params.image = true;
    if(selectedCategories.includes('video')) params.video = true;
    
    // Rating filter
    const selectedRating = this.ratingFilterControl.value;
    if(selectedRating) params.rating = selectedRating;
    
    this.loading = true;
    this.editorManagementService.getEditors(params).subscribe({
      next: (editors) => {
        console.log('Fetched editors successfully');
        this.editors = editors;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching editors:', error);
        this.loading = false;
      }
    });
  }

  get getEditors(): Editor[] {
    // console.log('editors:', this.editors);
    return this.editors;
  }

  // Define your columns
  editorColumns: TableColumn[] = [
    { key: 'fullname', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'username', header: 'Username'},
    { key: 'category', header: 'Categories' },
    { key: 'score', header: 'Score', sortable: true },
    { key: 'averageRating', header: 'Rating', sortable: true },
    { key: 'createdAt', header: 'Joined', type: 'date' },
    { key: 'isVerified', header: 'Verified', type: 'boolean' },
    { key: 'type', header: 'Actions', type: 'actions' }
  ];

  // Handle row click
  onEditorClick(editor: any) {
    console.log('Editor clicked:', editor);
  }

  // Handle action click (edit, delete, view)
  onEditorAction(event: { action: string, item: any }) {
    console.log(`${event.action} clicked for:`, event.item);
  }

  // Define icons for use in template
  icons = {
    search: Search,
    filter: Funnel,
    chevronDown: ChevronDown,
    export: ShareIcon,
    plus: Plus,
    fast: Zap,
    medium: Activity,
    slow: Hourglass,
    star: Star,
    close: X,
    check: Check,
    x: XIcon
  };

  // Open/close sidebar
  toggleRequestsSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
    // Reset current request when closing sidebar
    if (!this.sidebarVisible) {
      this.currentRequest = null;
      this.rejectionReason = '';
    }
  }

  // Approve a request
  approveRequest(request: EditorRequest): void {
    this.editorManagementService.approveRequest(request._id).subscribe({
      next: (response) => {
        console.log('Request approved:', response);
        this.loadEditorRequests();
        this.loadEditors();
      },
      error: (error) => {
        console.error('Error approving request:', error);
      }
    });
  }

  // Show rejection form
  showRejectionForm(request: EditorRequest): void {
    this.currentRequest = request;
    this.rejectionReason = '';
  }

  // Confirm rejection with reason
  confirmRejection(): void {
    if (this.currentRequest && this.rejectionReason.trim()) {
      this.editorManagementService.rejectRequest(this.currentRequest._id, this.rejectionReason).subscribe({
        next: (response) => {
          console.log('Request rejected:', response);
          this.loadEditorRequests();
        },
        error: (error) => {
          console.error('Error rejecting request:', error);
        }
      });
      this.cancelRejection();
    }
  }

  // Cancel rejection
  cancelRejection(): void {
    this.currentRequest = null;
    this.rejectionReason = '';
  }
}