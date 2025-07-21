import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum PaymentType {
  ADVANCE = 'advance',
  BALANCE = 'balance',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  WALLET = 'wallet',
}
export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true, collection: 'Transactions' })
export class Transaction {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Quotation' })
  quotationId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: false })
  paymentId?: string;

  @Prop({ type: String, required: false })
  orderId?: string;

  @Prop({ type: String, required: false })
  razorpayPaymentMethod?: string;

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

  @Prop({
    required: true,
    enum: PaymentMethod,
    default: PaymentMethod.RAZORPAY,
  })
  paymentMethod: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: Date, default: Date.now })
  paymentDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ quotationId: 1, paymentType: 1 }, { unique: true });
