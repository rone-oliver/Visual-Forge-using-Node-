import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EditorPublicProfile, User } from '../../interfaces/user.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileAttachmentResponse, GetQuotationsParams, IPaymentVerification, PaginatedQuotationsResponse } from '../../interfaces/quotation.interface';
import { CompletedWork, Works } from '../../interfaces/completed-work.interface';
import { IBid } from '../../interfaces/bid.interface';
import { PaginatedTransactionResponse } from '../../interfaces/transaction.interface';
import { GetPublicEditorsDto, PaginatedPublicEditors } from '../../interfaces/user.interface';
import { IPaginatedResponse, IWallet, IWalletTransaction } from '../../interfaces/wallet.interface';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _apiUrl = environment.apiUrl;
  private readonly _userApiUrl = this._apiUrl + '/user';

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _logger = inject(LoggerService);

  constructor() { };

  getUserProfile() {
    return this._http.get<User>(`${this._userApiUrl}/profile`).pipe(
      map((response: any) => {
        this._logger.info(`user profile response: `, response);
        return response;
      }),
      catchError((error) => {
        this._logger.error('Error fetching user profile:', error);
        throw error;
      })
    );
  }

  requestForEditor() {
    return this._http.post<boolean>(`${this._userApiUrl}/editor-requests`, {});
  }

  getEditorRequestStatus(): Observable<string | null> {
    return this._http.get<{ status: string }>(`${this._userApiUrl}/editor-requests`).pipe(
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
    return this._http.get<PaginatedQuotationsResponse>(`${this._userApiUrl}/quotations`, { params: httpParams }).pipe(
      map((response) => response),
      catchError((error) => {
        this._logger.error('Error fetching quotations with params:', error)
        throw error
      })
    )
  }

  getTransactionHistory(page: number, limit: number): Observable<PaginatedTransactionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this._http.get<PaginatedTransactionResponse>(`${this._userApiUrl}/transactions`, { params }).pipe(
      map(response => response),
      catchError(error => {
        this._logger.error('Error fetching transaction history:', error);
        throw error;
      })
    );
  }

  getEditorPublicProfile(editorId: string): Observable<EditorPublicProfile> {
    return this._http.get<EditorPublicProfile>(`${this._userApiUrl}/profile/editors/${editorId}`).pipe(
      map(response => response),
      catchError(error => {
        this._logger.error(`Error fetching editor profile for ID ${editorId}:`, error);
        throw error;
      })
    );
  }

  getPublicEditors(params: GetPublicEditorsDto): Observable<PaginatedPublicEditors> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this._http.get<PaginatedPublicEditors>(`${this._userApiUrl}/editors`, { params: httpParams }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getQuotationById(id: string): Observable<any> {
    return this._http.get<any>(`${this._userApiUrl}/quotations/${id}`).pipe(
      map((response) => response),
      catchError((error) => { throw error })
    )
  }

  createQuotation(quotation: any): Observable<boolean> {
    return this._http.post<boolean>(`${this._userApiUrl}/quotations`, quotation).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  updateQuotation(id: string, quotation: any): Observable<boolean> {
    return this._http.patch<boolean>(`${this._userApiUrl}/quotations/${id}`, quotation).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  deleteQuotation(id: string): Observable<boolean> {
    return this._http.delete<boolean>(`${this._userApiUrl}/quotations/${id}`).pipe(
      map(response => response),
      catchError(err => { throw err })
    )
  }

  updateProfileImage(url: string): Observable<{success:boolean}> {
    return this._http.patch<{success: boolean}>(`${this._userApiUrl}/profile/image`, { profileImageUrl: url }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  updateProfile(data: any): Observable<boolean> {
    return this._http.patch<boolean>(`${this._userApiUrl}/profile`, data).pipe(
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
    return this._http.post<FileAttachmentResponse[]>(`${this._userApiUrl}/quotations/upload`, formData, { reportProgress: true }).pipe(
      catchError(error => { throw error })
    )
  }

  resetPassword(data: { currentPassword: string, newPassword: string }): Observable<any> {
    return this._http.patch<any>(`${this._userApiUrl}/reset-password`, data).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this._http.get<CompletedWork[]>(`${this._userApiUrl}/quotations/completed`).pipe(
      map((response) => response),
      catchError((error) => { throw error })
    );
  }

  rateWork(workId: string, rating: number, feedback: string): Observable<boolean> {
    this._logger.debug('worksId', workId);
    return this._http.put<boolean>(`${this._userApiUrl}/quotations/${workId}/rating`, { rating, feedback }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  submitWorkFeedback(workId: string, feedback: string): Observable<any> {
    return this._http.post(`${this._userApiUrl}/works/${workId}/feedback`, { feedback });
  }

  markWorkAsSatisfied(workId: string): Observable<{ success: boolean }> {
    return this._http.patch<{ success: boolean }>(`${this._userApiUrl}/works/${workId}/satisfied`, {});
  }

  rateEditor(editorId: string, rating: number, feedback: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._userApiUrl}/editor/rating`, { editorId, rating, feedback }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  getCurrentEditorRating(editorId: string): Observable<{ rating: number, feedback: string }> {
    return this._http.get<{ rating: number, feedback: string }>(`${this._userApiUrl}/editor/rating`, { params: { editorId } }).pipe(
      map(response => response),
      catchError(error => { throw error })
    )
  }

  updateWorkPublicStatus(workId: string, isPublic: boolean): Observable<boolean> {
    return this._http.patch<boolean>(`${this._userApiUrl}/quotations/${workId}/public`, { isPublic }).pipe(
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
    return this._http.get<{ works: Works[], total: number }>(`${this._userApiUrl}/works/public`, {
      params
    }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getUsers(): Observable<User[]> {
    return this._http.get<User[]>(`${this._userApiUrl}/users`);
  }

  updateQuotationPayment(isAdvance: boolean, quotationId: string, amount: number, paymentDetails: IPaymentVerification): Observable<boolean> {
    this._logger.debug('paymentDetails:', paymentDetails);
    return this._http.patch<boolean>(`${this._userApiUrl}/quotations/${quotationId}/payment`, {
      isAdvancePaid: !isAdvance,
      orderId: paymentDetails.order_id, 
      paymentId: paymentDetails.id,       
      amount: paymentDetails.amount / 100, 
      razorpayPaymentMethod: paymentDetails.method, 
      currency: paymentDetails.currency,
      bank: paymentDetails.bank,
      wallet: paymentDetails.wallet,
      fee: paymentDetails.fee / 100,       
      tax: paymentDetails.tax / 100,       
      paymentDate: new Date(paymentDetails.created_at * 1000) 
    }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getBidsByQuotation(quotationId: string): Observable<IBid[]> {
    return this._http.get<IBid[]>(`${this._userApiUrl}/quotations/${quotationId}/bids`);
  }

  acceptBid(bidId: string): Observable<IBid> {
    return this._http.post<IBid>(`${this._userApiUrl}/bids/${bidId}/accept`, {});
  }

  getAcceptedBid(quotationId: string, editorId: string): Observable<IBid> {
    return this._http.get<IBid>(`${this._userApiUrl}/bids/${quotationId}/accepted`, { params: { editorId } });
  }

  cancelAcceptedBid(bidId: string): Observable<{ success: boolean }> {
    return this._http.patch<{ success: boolean }>(`${this._userApiUrl}/bids/${bidId}/cancel`, {});
  }

  getWalletDetails(): Observable<IWallet> {
    return this._http.get<IWallet>(`${this._userApiUrl}/wallet`);
  }

  getWalletTransactions(params: { page?: number; limit?: number; startDate?: string; endDate?: string }): Observable<IPaginatedResponse<IWalletTransaction>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this._http.get<IPaginatedResponse<IWalletTransaction>>(`${this._userApiUrl}/wallet/transactions`, { params: httpParams });
  }

  addMoneyToWallet(amount: number): Observable<IWallet> {
    return this._http.post<IWallet>(`${this._userApiUrl}/wallet/add`, { amount });
  }

  withdrawMoneyFromWallet(amount: number): Observable<IWallet> {
    return this._http.post<IWallet>(`${this._userApiUrl}/wallet/withdraw`, { amount });
  }

  reportUser(reportData: {
    reportedUserId: string;
    context: 'chat' | 'quotation';
    reason: string;
    additionalContext?: string;
  }): Observable<any> {
    return this._http.post(`${this._userApiUrl}/reports`, reportData);
  }

  followUser(userId: string): Observable<{ success: boolean }> {
    return this._http.post<{ success: boolean }>(`${this._userApiUrl}/follow/${userId}`, {});
  }

  unfollowUser(userId: string): Observable<{ success: boolean }> {
    return this._http.delete<{ success: boolean }>(`${this._userApiUrl}/follow/${userId}`, {});
  }
}