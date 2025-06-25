import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum BidStatus {
    PENDING = 'Pending',
    ACCEPTED = 'Accepted',
    REJECTED = 'Rejected',
    EXPIRED = 'Expired',
}

export type BidDocument = Bid & Document;

@Schema({timestamps: true})
export class Bid {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Quotation', required: true })
    quotationId: Types.ObjectId;
  
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    editorId: Types.ObjectId;
  
    @Prop({ required: true })
    bidAmount: number;
  
    @Prop({ type: String, enum: BidStatus, default: BidStatus.PENDING })
    status: BidStatus;
  
    @Prop({ required: true })
    dueDate: Date;
  
    @Prop({ required: false })
    notes: string;
  
    createdAt: Date;
    updatedAt: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);