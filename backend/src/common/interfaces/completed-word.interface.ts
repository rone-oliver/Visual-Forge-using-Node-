import { Types } from "mongoose";
import { FileAttachment } from "src/users/interface/Quotation.interface";
import { OutputType, QuotationStatus } from "../models/quotation.schema";

export interface CompletedWork {
    // Original quotation ID (preserved)
  quotationId: Types.ObjectId | string;
  
  // Works ID (from works schema)
  worksId: Types.ObjectId | string;
  
  // From quotation schema
  title: string;
  description: string;
  theme?: string;
  estimatedBudget: number;
  advanceAmount?: number;
  dueDate?: Date | string;
  status: QuotationStatus | string;
  outputType: OutputType | string;
  attachedFiles?: FileAttachment[];
  imageUrl?: string;
  
  // User and editor information
  userId: Types.ObjectId | string;
  editorId: Types.ObjectId | string;
  
  // From works schema
  finalFiles: FileAttachment[];
  comments: string;
  isPublic?: boolean;
  rating?: number;
  feedback?: string;
  
  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string;
}
