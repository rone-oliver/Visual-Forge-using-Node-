import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileType, IQuotation } from '../../../interfaces/quotation.interface';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/date.pipe';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FilesPreviewComponent } from '../../user/files-preview/files-preview.component';

@Component({
  selector: 'app-quotation-card',
  imports: [CommonModule, LocalDatePipe, MatIconModule, MatDialogModule],
  templateUrl: './quotation-card.component.html',
  styleUrl: './quotation-card.component.scss'
})
export class QuotationCardComponent {
  @Input() quotation!: IQuotation;
  @Output() quotationAccepted = new EventEmitter<IQuotation["_id"]>();
  FileType = FileType;
  
  constructor(private dialog: MatDialog){};

  acceptQuotation(quotation: IQuotation){
    if (!quotation._id) {
      console.error('Cannot accept quotation: Missing ID');
      return;
    }
    console.log('Accepting quotation', quotation._id);
    this.quotationAccepted.emit(quotation._id);
  }

  countFilesByType(fileType: FileType): number {
    if (!this.quotation.attachedFiles || this.quotation.attachedFiles.length === 0) {
      return 0;
    }
    return this.quotation.attachedFiles.filter(file => file.fileType === fileType).length;
  }

  openFileModal(fileType: FileType): void {
    if (!this.quotation.attachedFiles || this.quotation.attachedFiles.length === 0) {
      return;
    }
    
    const files = this.quotation.attachedFiles.filter(file => file.fileType === fileType);
    
    if (files.length === 0) {
      return;
    }
    
    this.dialog.open(FilesPreviewComponent, {
      width: '800px',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog-container',
      data: {
        files,
        fileType: fileType
      }
    });
  }
}
