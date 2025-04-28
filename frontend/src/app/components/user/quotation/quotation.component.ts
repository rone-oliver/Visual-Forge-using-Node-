import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { RouterModule } from '@angular/router';
import { FileAttachment, FileType, IQuotation } from '../../../interfaces/quotation.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FilesPreviewComponent } from '../files-preview/files-preview.component';
import { CompletedWork } from '../../../interfaces/completed-word.interface';
import { DatePipe, LocalDatePipe } from '../../../pipes/date.pipe';

@Component({
  selector: 'app-quotation',
  imports: [CommonModule, MatIconModule, RouterModule, MatDialogModule, LocalDatePipe],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  quotations: IQuotation[] = [];
  completedWorks: CompletedWork[] = [];
  completedWorksSearch: string = '';
  completedWorksLoading: boolean = false;
  FileType = FileType;
  activeFilter:  'All' | 'Accepted' | 'Published' | 'Completed' | 'Expired' | 'Cancelled' = 'All';

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.userService.getQuotations().subscribe({
      next: (quotations) => {
        this.quotations = quotations;
      },
      error: (err) => {
        console.error('error getting quotations', err);
      }
    })
  }

  setFilter(filter: 'All' | 'Accepted' | 'Published' | 'Expired' | 'Cancelled'): void {
    this.activeFilter = filter;
  }

  get filteredQuotations(): IQuotation[] {
    if (this.activeFilter === 'All') {
      return this.quotations;
    }
    return this.quotations.filter(q => q.status === this.activeFilter);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'accepted': return 'status-accepted';
      case 'expired': return 'status-expired';
      // case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-published';
    }
  }

  countFilesByType(quotation: IQuotation, fileType: FileType): number {
    if (!quotation.attachedFiles || quotation.attachedFiles.length === 0) {
      return 0;
    }
    return quotation.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(quotation: IQuotation, fileType: FileType): void {
    if (!quotation.attachedFiles || quotation.attachedFiles.length === 0) {
      return;
    }
    
    const files = quotation.attachedFiles.filter(file => file.fileType === fileType);
    
    if (files.length === 0) {
      return;
    }
    
    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  showCompletedWorks(){
    this.activeFilter = 'Completed';
    this.completedWorksLoading = true;
    this.loadCompletedWorks();
  }

  loadCompletedWorks():void{
    this.userService.getCompletedWorks().subscribe({
      next: (works) => {
        console.log('Completed works: ', works);
        this.completedWorks = works;
        this.completedWorksLoading = false;
      },
      error: (err) => {
        console.error('Error fetching completed works: ',err);
        this.completedWorksLoading = false;
      }
    });
  }

  countFinalFilesByType(work: CompletedWork, fileType: FileType): number{
    if (!work.finalFiles) return 0;
    return work.finalFiles.filter(file => file.fileType === fileType).length;
  }

  openFinalFilesModal(work: CompletedWork, fileType: FileType): void {
    if (!work.finalFiles || work.finalFiles.length === 0) {
      return;
    }

    const files = work.finalFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        files,
        fileType: fileType
      }
    });
  }

  countAttachedFilesByType(work: CompletedWork, fileType: FileType): number {
    if (!work.attachedFiles) return 0;
    return work.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openAttachedFileModal(work: CompletedWork, fileType: FileType): void {
    if (!work.attachedFiles || work.attachedFiles.length === 0) {
      return;
    }

    const files = work.attachedFiles.filter(file => file.fileType === fileType);

    if (files.length === 0) {
      return;
    }

    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      data: { files, title: 'Client Files' }
    });
  }
}
