import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { FileAttachmentResponse, GetEditorQuotationsParams, IQuotation, OutputType, PaginatedEditorQuotationsResponse, QuotationStatus } from '../../interfaces/quotation.interface';
import { CompletedWork } from '../../interfaces/completed-word.interface';
import { Editor } from '../../interfaces/editor.interface';
import { IBid } from '../../interfaces/bid.interface';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private readonly apiUrl = environment.apiUrl;
  private readonly editorApiUrl = `${this.apiUrl}/editor`;

  constructor(private http: HttpClient) { };

  getPublishedQuotations(params: GetEditorQuotationsParams): Observable<PaginatedEditorQuotationsResponse>{
    let httpParams = new HttpParams();
    if(params.page){
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.mediaType && params.mediaType !== 'All' && params.mediaType !== OutputType.MIXED) {
      httpParams = httpParams.set('mediaType', params.mediaType);
    }
    if (params.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }
    httpParams = httpParams.set('status',QuotationStatus.PUBLISHED);
    return this.http.get<PaginatedEditorQuotationsResponse>(`${this.editorApiUrl}/quotations`, { params: httpParams });
  }

  getAcceptedQuotations(params: {
    page: number;
    limit: number;
    searchTerm?: string;
  }): Observable<PaginatedEditorQuotationsResponse>{
    let httpParams = new HttpParams()
      .set('status',QuotationStatus.ACCEPTED)
      .set('page',params.page.toString())
      .set('limit',params.limit.toString());
    
    if(params.searchTerm){
      httpParams = httpParams.set('searchTerm', params.searchTerm.trim());
    }
    return this.http.get<PaginatedEditorQuotationsResponse>(`${this.editorApiUrl}/quotations`, { params: httpParams });
  }

  submitQuotationResponse(workData: any): Observable<boolean>{
    return this.http.post<boolean>(`${this.editorApiUrl}/quotations/response`, workData);
  }

  uploadWorkFiles(files: File[]): Observable<FileAttachmentResponse[]>{
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder','Visual Forge/Work Files');
    return this.http.post<FileAttachmentResponse[]>(`${this.editorApiUrl}/uploads/work`, formData,{ reportProgress: true}).pipe(
      catchError(error => { throw error})
    );
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this.http.get<CompletedWork[]>(`${this.editorApiUrl}/works`).pipe(
      catchError(error => { throw error })
    );
  }

  // Bids Services
  createBid(quotationId: string, bidAmount: number, notes?: string): Observable<IBid> {
    return this.http.post<IBid>(`${this.editorApiUrl}/bids`, {
      quotationId,
      bidAmount,
      notes
    });
  }

  getEditorBids(): Observable<IBid[]> {
    return this.http.get<IBid[]>(`${this.editorApiUrl}/bids`);
  }

  updateBid(
    bidId: string, amount: number, notes?: string,
  ): Observable<IBid> {
    return this.http.patch<IBid>(`${this.editorApiUrl}/bids/${bidId}`, {
      bidAmount: amount,
      notes
    });
  }

  deleteBid(bidId: string): Observable<void> {
    return this.http.delete<void>(`${this.editorApiUrl}/bids/${bidId}`);
  }
}
