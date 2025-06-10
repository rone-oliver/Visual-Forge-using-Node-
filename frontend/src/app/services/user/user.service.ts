import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileAttachmentResponse, GetQuotationsParams, IPaymentVerification, PaginatedQuotationsResponse } from '../../interfaces/quotation.interface';
import { CompletedWork, Works } from '../../interfaces/completed-word.interface';
import { IBid } from '../../interfaces/bid.interface';
import { PaginatedTransactionResponse } from '../../interfaces/transaction.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private userApiUrl = this.apiUrl + '/user';

  constructor(
    private http: HttpClient,
  ) { };

  getUserProfile() {
    return this.http.get<User>(`${this.userApiUrl}/profile`).pipe(
      map((response: any) => {
        console.log(`user profile response: `, response);
        return response;
      }),
      catchError((error) => {
        console.error('Error fetching user profile:', error);
        throw error;
      })
    );
  }

  requestForEditor() {
    return this.http.post<boolean>(`${this.userApiUrl}/editor-requests`, {});
  }

  getEditorRequestStatus(): Observable<string | null> {
    return this.http.get<{ status: string }>(`${this.userApiUrl}/editor-requests`).pipe(
      map(response => response.status),
      catchError(() => of(null))
    );
  }

  getQuotations(params?: GetQuotationsParams): Observable<PaginatedQuotationsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.searchTerm) {
        httpParams = httpParams.set('searchTerm', params.searchTerm);
      }
    }
    return this.http.get<PaginatedQuotationsResponse>(`${this.userApiUrl}/quotations`, { params: httpParams }).pipe(
      map((response) => response),
      catchError((error) => {
        console.error('Error fetching quotations with params:', error)
        throw error
      })
    )
  }

  getTransactionHistory(page: number, limit: number): Observable<PaginatedTransactionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedTransactionResponse>(`${this.userApiUrl}/transactions`, { params }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error fetching transaction history:', error);
        throw error;
      })
    );
  }

  getQuotationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.userApiUrl}/quotations/${id}`).pipe(
      map((response) => response),
      catchError((error) => { throw error })
    )
  }

  createQuotation(quotation: any): Observable<boolean> {
    return this.http.post<boolean>(`${this.userApiUrl}/quotations`, { quotation }).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  updateQuotation(id: string, quotation: any): Observable<boolean> {
    return this.http.patch<boolean>(`${this.userApiUrl}/quotations/${id}`, { quotation }).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  deleteQuotation(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.userApiUrl}/quotations/${id}`).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  updateProfileImage(url: string): Observable<{success:boolean}> {
    return this.http.patch<{success: boolean}>(`${this.apiUrl}/user/profile/image`, { profileImageUrl: url }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  updateProfile(data: any): Observable<boolean> {
    return this.http.patch<boolean>(`${this.apiUrl}/user/profile`, data).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  uploadQuotationFiles(files: File[]): Observable<FileAttachmentResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', 'Visual Forge/Quotation Attachments');
    return this.http.post<FileAttachmentResponse[]>(`${this.apiUrl}/user/quotations/upload`, formData, { reportProgress: true }).pipe(
      catchError(error => { throw error })
    )
  }

  resetPassword(data: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/user/reset-password`, data).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this.http.get<CompletedWork[]>(`${this.apiUrl}/user/quotations/completed`).pipe(
      map((response) => response),
      catchError((error) => { throw error })
    );
  }

  rateWork(workId: string, rating: number, feedback: string): Observable<boolean> {
    console.log('worksId', workId);
    return this.http.put<boolean>(`${this.userApiUrl}/quotations/${workId}/rating`, { rating, feedback }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  rateEditor(editorId: string, rating: number, feedback: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.userApiUrl}/editor/rating`, { editorId, rating, feedback }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  getCurrentEditorRating(editorId: string): Observable<{ rating: number, feedback: string }> {
    return this.http.get<{ rating: number, feedback: string }>(`${this.userApiUrl}/editor/rating`, { params: { editorId } }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  updateWorkPublicStatus(workId: string, isPublic: boolean): Observable<boolean> {
    return this.http.patch<boolean>(`${this.apiUrl}/user/quotations/${workId}/public`, { isPublic }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getPublicWorks(
    page: number = 1,
    limit: number = 10,
    rating: number | null = null,
    search: string = ''
  ): Observable<{ works: Works[], total: number }> {
    let params = new HttpParams()
      .set('page',page.toString())
      .set('limit',limit.toString());
    if (rating !== null) {
      params = params.set('rating', rating.toString());
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<{ works: Works[], total: number }>(`${this.apiUrl}/user/works/public`, {
      params
    }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.userApiUrl}/users`);
  }

  createPaymentOrder(amount: number): Observable<any> {
    return this.http.post<any>(`${this.userApiUrl}/payment`, { amount }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  updateQuotationPayment(isAdvance: boolean, quotationId: string, amount: number, paymentDetails: IPaymentVerification): Observable<boolean> {
    console.log('paymentDetails:', paymentDetails);
    return this.http.patch<boolean>(`${this.userApiUrl}/quotations/${quotationId}/payment`, {
      isAdvancePaid: !isAdvance,
      orderId: paymentDetails.orderId,
      paymentId: paymentDetails.paymentId,
      amount
    }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getBidsByQuotation(quotationId: string): Observable<IBid[]> {
    return this.http.get<IBid[]>(`${this.userApiUrl}/quotations/${quotationId}/bids`);
  }

  acceptBid(bidId: string): Observable<IBid> {
    return this.http.post<IBid>(`${this.userApiUrl}/bids/${bidId}/accept`, {});
  }
}
