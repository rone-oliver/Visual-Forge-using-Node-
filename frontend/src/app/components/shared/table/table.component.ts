import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '../../../pipes/date.pipe';
import { LucideAngularModule, CheckCircle, XCircle, Edit, Trash, Ban, Check} from 'lucide-angular';

export interface TableColumn {
  key: string;          // Property name in data object
  header: string;       // Display name for column header
  type?: 'text' | 'date' | 'image' | 'boolean' | 'actions'; // Type of data for rendering
  placeholder?:string;
  width?: string;       // Optional width (e.g., '100px', '10%')
  sortable?: boolean;   // Whether column is sortable
  format?: (value: any) => string; // Optional formatter function
}

@Component({
  selector: 'app-table',
  imports: [CommonModule, FormsModule,DatePipe, LucideAngularModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  @Input() data: any[] = [];

  @Input() columns: TableColumn[] = [];
  @Input() pageSize: number = 10;
  @Input() showPagination: boolean = true;

  @Input() loading: boolean = false;

  @Input() emptyMessage: string = 'No data available';

  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: string, item: any}>();

  defaultPlaceholder: string = 'N/A'
  currentPage: number = 1;
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  get paginatedData(): any[]{
    if(!this.showPagination) return this.data;
    const startIndex = (this.currentPage - 1)*this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  icons = {
    check: CheckCircle,
    x: XCircle,
    edit: Edit,
    delete: Trash,
    block: Ban,
    unblock: Check,
  }

  onRowClick(item: any): void {
    this.rowClick.emit(item);
  }

  onActionClick(action: string, item: any, event: Event): void {
    event.stopPropagation(); // Prevent row click
    this.actionClick.emit({ action, item });
  }

  sort(column: TableColumn): void {
    if (!column.sortable) return;
    
    if (this.sortColumn === column.key) {
      // Toggle direction if already sorting by this column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column and default to ascending
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }
    
    // Sort the data
    this.data = [...this.data].sort((a, b) => {
      const valueA = this.getNestedProperty(a, column.key);
      const valueB = this.getNestedProperty(b, column.key);
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Helper to get nested properties like 'user.name'
  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => (o ? o[p] : null), obj);
  }
}
