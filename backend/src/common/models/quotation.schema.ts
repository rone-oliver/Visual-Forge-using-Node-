import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum QuotationStatus{
    PUBLISHED = 'Published',
    ACCEPTED = 'Accepted',
    COMPLETED = 'Completed',
    EXPIRED = 'Expired',
    CANCELLED = 'Cancelled',
}

export type QuotationDocument = Quotation & Document;

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
    price: number;

    @Prop({ type: Number })
    advanceAmount: number;

    @Prop({ type: Date})
    dueDate: Date;

    @Prop({ type: Array})
    attachedFiles: string[];

    @Prop({ type: String, enum: QuotationStatus})
    status: QuotationStatus;

    @Prop({ type: Types.ObjectId, ref: 'Editor'})
    editorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Works'})
    worksId: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);