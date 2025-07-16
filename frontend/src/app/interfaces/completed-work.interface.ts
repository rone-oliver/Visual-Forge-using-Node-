import { Editor } from "./editor.interface";
import { FileAttachmentResponse, OutputType, QuotationStatus, TimelineEvent } from "./quotation.interface";
import { User } from "./user.interface";

export interface CompletedWork {
    // Original quotation ID (preserved)
    quotationId: string;

    // Works ID (from works schema)
    worksId: string;

    // From quotation schema
    title: string;
    description: string;
    theme?: string;
    estimatedBudget: number;

    isAdvancePaid?: boolean;
    isFullyPaid?: boolean;
    advanceAmount?: number;
    balanceAmount: number;
    penalty?: number;

    dueDate?: Date | string;
    status: QuotationStatus | string;
    outputType: OutputType | string;
    attachedFiles?: FileAttachmentResponse[];
    imageUrl?: string;

    // User and editor information
    userId: string;
    editorId: string;

    // From works schema
    finalFiles: FileAttachmentResponse[];
    comments: string;
    isPublic?: boolean;
    rating?: number;
    feedback?: string;

    // Timestamps
    createdAt: Date | string;
    updatedAt?: Date | string;
    completedAt?: Date | string;
    timeline?: TimelineEvent[];
    isSatisfied?: boolean;
}

export interface Works {
    _id: string;
    editorId: string;
    userId: string;
    editor: Editor;
    user: User;
    finalFiles: FileAttachmentResponse[];
    isPublic: boolean;
    comments?: string;
    rating?: number;
    feedback?: string;

    createdAt?: Date | string;
    updatedAt?: Date | string;
}