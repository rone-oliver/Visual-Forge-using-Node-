import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuotationCardComponent } from '../quotation-card/quotation-card.component';
import { IQuotation, OutputType } from '../../../interfaces/quotation.interface';
import { EditorService } from '../../../services/editor/editor.service';

@Component({
  selector: 'app-quotation',
  imports: [CommonModule,QuotationCardComponent],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  quotations: IQuotation[] = [];
  OutputType = OutputType;
  selectedMediaType: OutputType = OutputType.MIXED;
  constructor(
    private editorService:EditorService,
  ){};
  ngOnInit():void{
    this.getPublishedQuotations();
  };

  getPublishedQuotations(): void{
    this.editorService.getPublishedQuotations().subscribe({
      next: (quotations) => {
        this.quotations = quotations;
      },
      error: (error) =>{
        console.error('error getting quotations', error);
      }
    })
  }

  navigateToAccepted(){
    console.log('Navigating to accepted quotations');
  }

  setMediaType(type: OutputType){
    // this.quotations = this.quotations.filter(quotation => quotation.outputType === type );
    this.selectedMediaType = type;
  }

  get filteredQuotations(): IQuotation[] {
    if (this.selectedMediaType === OutputType.MIXED) {
      return this.quotations;
    }
    return this.quotations.filter(quotation => quotation.outputType === this.selectedMediaType);
  }

  quotationAcceptedHandler(quotationId: string): void {
    console.log('Quotation accepted:', quotationId);
    this.editorService.acceptQuotation(quotationId).subscribe({
      next: (response) => {
        console.log('Quotation accepted response:', response);
        this.getPublishedQuotations();
      },
      error: (error) => {
        console.error('Error accepting quotation:', error);
      }
    })
  }

  trackByQuotationId(index: number, quotation: IQuotation): string {
    return quotation._id || String(index);
  }
}
