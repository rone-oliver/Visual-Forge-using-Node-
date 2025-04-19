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
class FileAttachment {
    @Prop({ required: true })
    url: string;

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
    outputType: string;

    @Prop({ type: Number })
    advanceAmount: number;

    @Prop({ type: Date})
    dueDate: Date;

    @Prop({ type: [{ type: FileAttachment }] })
    attachedFiles: FileAttachment[];

    @Prop({ type: String, enum: QuotationStatus, default: QuotationStatus.PUBLISHED})
    status: QuotationStatus;

    @Prop({ type: Types.ObjectId, ref: 'Editor'})
    editorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Works'})
    worksId: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);