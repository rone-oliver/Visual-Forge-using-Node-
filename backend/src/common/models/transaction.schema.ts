import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum PaymentType {
    ADVANCE = 'advance',
    BALANCE = 'balance'
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}
export enum PaymentMethod {
    RAZORPAY = 'razorpay',
    PAYPAL = 'paypal',
    STRIPE = 'stripe'
}
export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true, collection: 'Transactions' })
export class Transaction {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Quotation' })
    quotationId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    paymentId: string;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    razorpayPaymentMethod: string;

    @Prop({ required: true })
    currency: string;

    @Prop()
    bank: string;

    @Prop()
    wallet: string;

    @Prop()
    fee: number;

    @Prop()
    tax: number;

    @Prop({ required: true, type: Number })
    amount: number;

    @Prop({ required: true, enum: PaymentType })
    paymentType: PaymentType;

    @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.RAZORPAY })
    paymentMethod: PaymentMethod;

    @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Prop({ required: true, default: Date.now })
    paymentDate: Date;

    createdAt: Date;
    updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);