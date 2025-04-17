import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { RouterModule } from '@angular/router';
import { IQuotation } from '../../../interfaces/quotation.interface';


// interface Quotation {
//   id: number;
//   estimatedBudget: number;
//   title: string;
//   description: string;
//   imageUrl: string;
//   status: 'accepted' | 'expired' | 'pending' | 'finished';
//   editor: string;
//   paymentPending?: boolean;
//   theme: string;
//   linkedFiles: number;
// }
@Component({
  selector: 'app-quotation',
  imports: [CommonModule, MatIconModule,RouterModule],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  quotations: IQuotation[] = [];
  activeFilter: 'all' | 'accepted' | 'pending' | 'finished' | 'expired' = 'all';

  constructor(
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    // This would typically come from a service
    // this.quotations = [
    //   {
    //     id: 1,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'accepted',
    //     editor: 'username',
    //     paymentPending: true,
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   },
    //   {
    //     id: 2,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'expired',
    //     editor: 'username',
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   },
    //   {
    //     id: 3,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'pending',
    //     editor: 'username',
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   },
    //   {
    //     id: 4,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'accepted',
    //     editor: 'username',
    //     paymentPending: true,
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   },
    //   {
    //     id: 5,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'finished',
    //     editor: 'username',
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   },
    //   {
    //     id: 6,
    //     amount: 200,
    //     title: 'The good police',
    //     description: 'A short video',
    //     imageUrl: 'https://placehold.co/600x400',
    //     status: 'accepted',
    //     editor: 'username',
    //     paymentPending: true,
    //     theme: 'National Police Day',
    //     linkedFiles: 2
    //   }
    // ];
    this.userService.getQuotations().subscribe({
      next: (quotations) => {
        this.quotations = quotations;
      },
      error: (err) => {
        console.error('error getting quotations', err);
      }
    })
  }

  setFilter(filter: 'all' | 'accepted' | 'pending' | 'finished' | 'expired'): void {
    this.activeFilter = filter;
  }

  get filteredQuotations(): IQuotation[] {
    if (this.activeFilter === 'all') {
      return this.quotations;
    }
    return this.quotations.filter(q => q.status === this.activeFilter);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'accepted': return 'status-accepted';
      case 'expired': return 'status-expired';
      case 'pending': return 'status-pending';
      case 'finished': return 'status-finished';
      default: return '';
    }
  }
}
