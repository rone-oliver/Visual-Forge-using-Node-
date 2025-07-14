import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { FileAttachmentResponse, GetEditorQuotationsParams, IQuotation, OutputType, PaginatedEditorQuotationsResponse, QuotationStatus } from '../../interfaces/quotation.interface';
import { CompletedWork } from '../../interfaces/completed-word.interface';
import { Editor } from '../../interfaces/editor.interface';
import { IBid, BidStatus, GetBiddedQuotationsQuery, PaginatedBiddedQuotationsResponse, EditorBid } from '../../interfaces/bid.interface';

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

  getEditorBidForQuotation(quotationId: string): Observable<EditorBid> {
    return this.http.get<EditorBid>(
      `${this.editorApiUrl}/bids/quotation/${quotationId}`
    );
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

  updateWorkFiles(workId: string, files: File[], deleteFileIds?: string[]): Observable<any> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    if (deleteFileIds && deleteFileIds.length > 0) {
      // The backend expects a stringified array for this field when using multipart/form-data
      // formData.append('deleteFileIds', JSON.stringify(deleteFileIds));
      deleteFileIds.forEach(id => {
        formData.append('deleteFileIds', id);
      });
    }

    return this.http.patch(`${this.editorApiUrl}/works/${workId}/files`, formData);
  }

  // Bids Services
  createBid(quotationId: string, bidAmount: number, notes?: string): Observable<IBid> {
    return this.http.post<IBid>(`${this.editorApiUrl}/bids`, {
      quotationId,
      bidAmount,
      notes
    });
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

  getBiddedQuotations(params: GetBiddedQuotationsQuery): Observable<PaginatedBiddedQuotationsResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params.hideNonBiddable) {
      httpParams = httpParams.set('hideNonBiddable', params.hideNonBiddable);
    }

    return this.http.get<PaginatedBiddedQuotationsResponse>(`${this.editorApiUrl}/bids`, { params: httpParams });
  }

  addTutorial(tutorialUrl: string): Observable<Editor> {
    return this.http.post<Editor>(`${this.editorApiUrl}/tutorials`, { tutorialUrl });
  }

  removeTutorial(tutorialUrl: string): Observable<Editor> {
    return this.http.delete<Editor>(`${this.editorApiUrl}/tutorials`, { body: { tutorialUrl } });
  }

  cancelAcceptedBid(bidId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.editorApiUrl}/bids/${bidId}/cancel`, {});
  }
}
