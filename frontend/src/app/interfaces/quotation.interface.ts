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

export interface FileAttachmentResponse {
    url: string;
    fileType: FileType;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
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
    imageUrl?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IPaymentVerification {
    success: boolean;
    orderId: string;
    paymentId: string;
    signature: string;
}