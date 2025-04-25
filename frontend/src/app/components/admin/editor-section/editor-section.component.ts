import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activity, Hourglass, LucideAngularModule, Zap } from 'lucide-angular';
import { Search, Funnel, ChevronDown, ShareIcon, Plus, Clock, Star, X, X as XIcon, Check } from 'lucide-angular';
import { EditorRequest } from '../../../interfaces/user.interface';
import { EditorManagementService } from '../../../services/admin/editor-management.service';
import { DatePipe } from '../../../pipes/date.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableColumn, TableComponent } from '../../shared/table/table.component';
import { MatIconModule } from '@angular/material/icon';
import { Editor } from '../../../interfaces/editor.interface';

@Component({
  selector: 'app-editor-section',
  imports: [CommonModule, FormsModule, MatIconModule, MatCheckboxModule, LucideAngularModule, DatePipe, TableComponent],
  templateUrl: './editor-section.component.html',
  styleUrl: './editor-section.component.scss'
})
export class EditorSectionComponent implements OnInit {
  searchQuery:string ='';
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

  loadEditors(){
    this.editorManagementService.getEditors().subscribe({
      next: (editors) => {
        console.log('Fetched editors successfully');
        this.editors = editors;
      },
      error: (error) => {
        console.error('Error fetching editors:', error);
      }
    })
  }

  get getEditors(): Editor[] {
    console.log('editors data: ',this.editors);
    return this.editors.filter(editor => {
      //Search filter
      const query = this.searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (editor.fullname && editor.fullname.toLowerCase().includes(query)) ||
        (editor.email && editor.email.toLowerCase().includes(query));
  
      //Category filter
      const selectedCategories = Object.entries(this.selectedFilters.category)
        .filter(([cat, selected]) => selected)
        .map(([cat]) => cat.toLowerCase());

      const editorCategories = Array.isArray(editor.category)
        ? editor.category.map((cat: string) => cat.toLowerCase())
        : [];
  
      const matchesCategory =
        selectedCategories.length === 0 ||
        (selectedCategories.every(cat => editorCategories.includes(cat)));
      
      //Rating filter
      const matchesRating =
        !this.selectedFilters.rating ||
        (editor.score && editor.score >= this.selectedFilters.rating);
  
      // Avg Time filter
      // You need to define how avgTime is represented in your editor object.
      // Example assumes editor.avgTime is 'fast' | 'medium' | 'slow'
      // const matchesAvgTime =
      //   !this.selectedFilters.avgTime ||
      //   (editor.avgTime && editor.avgTime === this.selectedFilters.avgTime);
  
      // // --- Combine all filters ---
      return matchesSearch && matchesCategory && matchesRating;
    });
  }

  // Define your columns
editorColumns: TableColumn[] = [
  { key: 'fullname', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'category', header: 'Categories' },
  { key: 'score', header: 'Score', sortable: true },
  { key: 'createdAt', header: 'Joined', type: 'date' },
  { key: 'isVerified', header: 'Verified', type: 'boolean' },
  { key: 'type', header: 'Actions', type: 'actions' }
];

// Handle row click
onEditorClick(editor: any) {
  console.log('Editor clicked:', editor);
}

// Handle action click (edit, delete, view)
onEditorAction(event: {action: string, item: any}) {
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

  // Filter toggle states
  activeFilters: Record<string, boolean> = {
    category: false,
    rating: false,
    avgTime: false
  };

  selectedFilters = {
    category: {
      video: false,
      image: false,
      audio: false
    },
    rating: 0,
    avgTime: 0,
  };

  // Toggle filter visibility
  toggleFilter(filter: string): void {
    this.activeFilters[filter] = !this.activeFilters[filter];

    // Close other filters when opening a new one
    Object.keys(this.activeFilters).forEach(key => {
      if (key !== filter && this.activeFilters[filter]) {
        this.activeFilters[key] = false;
      }
    });
  }

  toggleRating(rating: number) {
    this.selectedFilters.rating = this.selectedFilters.rating === rating ? 0 : rating;
  }

  selectAvgTime(time: number){
    this.selectedFilters.avgTime = time;
  }

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
      })
      this.cancelRejection();
    }
  }

  // Cancel rejection
  cancelRejection(): void {
    this.currentRequest = null;
    this.rejectionReason = '';
  }

  // Add these methods to your component class
  // getActiveFilterChips(): { type: string, value: string }[] {
  //   const chips: { type: string, value: string }[] = [];

  //   // Add category chips
  //   Object.entries(this.selectedFilters.category).forEach(([category, isSelected]) => {
  //     if (isSelected) {
  //       chips.push({ type: 'category', value: category });
  //     }
  //   });

  //   // Add rating chip
  //   if (this.selectedFilters.rating) {
  //     chips.push({ type: 'rating', value: this.selectedFilters.rating });
  //   }

  //   // Add time chip
  //   if (this.selectedFilters.avgTime) {
  //     chips.push({ type: 'avgTime', value: this.selectedFilters.avgTime });
  //   }

  //   return chips;
  // }

  // removeFilter(type: string, value: string): void {
  //   if (type === 'category') {
  //     this.selectedFilters.category[value as keyof typeof this.selectedFilters.category] = false;
  //   } else if (type === 'rating') {
  //     this.selectedFilters.rating = '';
  //   } else if (type === 'avgTime') {
  //     this.selectedFilters.avgTime = '';
  //   }
  // }
}