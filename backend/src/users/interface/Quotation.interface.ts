import { Types } from "mongoose";
import { OutputType, QuotationStatus } from "src/common/models/quotation.schema";

export interface IQuotation {
    _id?: string | Types.ObjectId;
    userId?: string | Types.ObjectId;
    title: string;
    description: string;
    theme?: string;
    estimatedBudget?: number;
    advanceAmount?: number;
    dueDate?: Date | string;
    status?: QuotationStatus;
    outputType: OutputType;
    editor?: string;
    editorId?: string | Types.ObjectId;
    paymentPending?: boolean;
    attachedFiles?: FileAttachment[];
    imageUrl?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    bidCount?: number;
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