import { IEditorBidDetails } from "./bid.interface";

export enum QuotationStatus {
    PUBLISHED = 'Published',
    ACCEPTED = 'Accepted',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    EXPIRED = 'Expired',
}

export enum OutputType {
    IMAGE = 'Image',
    VIDEO = 'Video',
    AUDIO = 'Audio',
    MIXED = 'Mixed'
}

export enum FileType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document'
}

export interface FileAttachment {
    url: string;
    fileType: FileType;
    fileName: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
}

export interface TimelineEvent {
    event: string;
    message: string;
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface FileAttachmentResponse {
    url?: string;
    uniqueId: string;
    timestamp: number;
    fileType: FileType;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}

export interface GetQuotationsParams {
    page?: number;
    limit?: number;
    status?: QuotationStatus | 'All';
    searchTerm?: string;
}

export interface GetEditorQuotationsParams {
    page?: number;
    limit?: number;
    mediaType?: OutputType | string; // 'All' or 'Mixed' can be strings
    searchTerm?: string;
}
  
export interface PaginatedQuotationsResponse {
    quotations: IQuotation[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
}

export interface PaginatedEditorQuotationsResponse {
    quotations: IQuotationWithEditorBid[];
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    // totalPages might not be directly provided by the new backend response, calculate if needed
}

export interface FileUploadProgress {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    url?: string;
    fileType: FileType;
    error?: string;
}

export interface IQuotation {
    _id: string;
    userId?: string;
    title: string;
    description: string;
    theme?: string;
    estimatedBudget: number;
    advanceAmount?: number;
    isAdvancePaid?: boolean;
    dueDate?: Date | string;
    status: QuotationStatus | string;
    outputType: OutputType | string;
    editor?: string;
    editorId?: string;
    paymentPending?: boolean;
    attachedFiles?: FileAttachment[];
    bidCount?: number;
    imageUrl?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IQuotationWithEditorBid extends IQuotation {
    editorBid?: IEditorBidDetails | null;
    userFullName?: string;
}

export interface IPaymentVerification {
    success: boolean;
    // orderId: string;
    order_id: string;
    id: string;
    // paymentId: string;
    method: string;
    amount: number;
    wallet: string;
    currency: string;
    bank: string;
    fee: number;
    tax: number;
    created_at: number;
    signature: string;
}