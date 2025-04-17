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
    linkedFiles?: number;
    imageUrl?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}