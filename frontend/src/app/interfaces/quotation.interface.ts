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

export interface IQuotation {
    _id?: string;
    userId?: string;
    title: string;
    description: string;
    theme?: string;
    estimatedBudget: number;
    advanceAmount?: number;
    dueDate?: Date | string;
    status: QuotationStatus | string;
    outputType: OutputType | string;
    editor?: string;
    editorId?: string;
    paymentPending?: boolean;
    linkedFiles?: number;
    imageUrl?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}