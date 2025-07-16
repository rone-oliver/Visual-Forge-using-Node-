import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum QuotationStatus{
    PUBLISHED = 'Published',
    ACCEPTED = 'Accepted',
    COMPLETED = 'Completed',
    EXPIRED = 'Expired',
    CANCELLED = 'Cancelled',
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

export type QuotationDocument = Quotation & Document;

@Schema()
export class FileAttachment {
    @Prop()
    url?: string;

    @Prop({ required: true, enum: FileType, type: String })
    fileType: FileType;

    @Prop()
    fileName: string;

    @Prop()
    size?: number;

    @Prop()
    mimeType?: string;

    @Prop({ default: Date.now })
    uploadedAt: Date;

    @Prop({ required:true, type: String })
    uniqueId: string;

    @Prop({ required: true, type: Number })
    timestamp: number;
}

@Schema({ timestamps: true, collection: 'Quotations'})
export class Quotation {
    _id: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId;

    @Prop({ required: true, type: String, trim: true})
    title: string;

    @Prop({ required: true, type: String, trim: true})
    description: string;

    @Prop({ type: String, trim: true})
    theme: string;

    @Prop({ type: Number})
    estimatedBudget: number;

    @Prop({ type: String, enum: OutputType, required: true})
    outputType: OutputType;

    @Prop({ type: Number })
    advanceAmount: number;
    @Prop({ type: Number })
    balanceAmount: number;

    @Prop({ type: Boolean, default: false})
    isAdvancePaid: boolean;
    @Prop({ type: Boolean, default: false})
    isFullyPaid: boolean;

    @Prop({ type: Date})
    dueDate: Date;

    @Prop({ type: [{ type: FileAttachment }], _id: false })
    attachedFiles: FileAttachment[];

    @Prop({ type: String, enum: QuotationStatus, default: QuotationStatus.PUBLISHED})
    status: QuotationStatus;

    @Prop({ type: Types.ObjectId, ref: 'Editor'})
    editorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Works'})
    worksId: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    penalty: number;

    @Prop({ type: String })
    advancePaymentOrderId: string;

    @Prop({ type: String })
    balancePaymentOrderId: string;

    @Prop({ type: Boolean, default: false })
    isPaymentInProgress: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);