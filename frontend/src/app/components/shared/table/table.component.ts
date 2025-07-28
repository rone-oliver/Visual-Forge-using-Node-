import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, output, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '../../../pipes/date.pipe';
import { LucideAngularModule, CheckCircle, XCircle, Edit, Trash, Ban, Check, ShieldCheck, ChevronRight, ChevronLeft} from 'lucide-angular';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

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
  imports: [CommonModule, FormsModule,DatePipe, LucideAngularModule, MediaProtectionDirective],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  @Input() data: any[] = [];

  @Input() columns: TableColumn[] = [];
  @Input() pageSize = 10;
  totalItems = input<number>(0); // Total items for backend pagination
  currentPage = input<number>(1); // Current page controlled by parent
  @Input() showPagination = true;

  @Input() loading = false;

  @Input() emptyMessage = 'No data available';
  @Input() blockedStatusKey = 'isBlocked'; // Default key

  showResolveAction = input<boolean>(true);
  showBlockAction = input<boolean>(true);
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: string, item: any}>();
  pageChange = output<number>();
  sortChange = output<{key: string, direction: 'asc' | 'desc'}>();

  defaultPlaceholder = 'N/A'
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Data is now pre-paginated by the parent component.
  get paginatedData(): any[]{
    return this.data;
  }

  get totalPages(): number {
    if (!this.totalItems() || this.totalItems() === 0) return 1;
    return Math.ceil(this.totalItems() / this.pageSize);
  }

  icons = {
    check: CheckCircle,
    x: XCircle,
    edit: Edit,
    delete: Trash,
    block: Ban,
    unblock: Check,
    resolve: ShieldCheck,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight
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
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }
    
    // Emit sort event instead of sorting locally
    this.sortChange.emit({ key: this.sortColumn, direction: this.sortDirection });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
  
  prevPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
  
  // Helper to get nested properties like 'user.name'
  isItemBlocked(item: any): boolean {
    return this.getNestedProperty(item, this.blockedStatusKey);
  }

  getNestedProperty(obj: any, path: string): any {
    if (!path) {
      return undefined;
    }
    return path.split('.').reduce((o, p) => (o ? o[p] : null), obj);
  }
}
