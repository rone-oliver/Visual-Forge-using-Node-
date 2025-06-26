import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Quotation } from 'src/common/models/quotation.schema';
import { User } from 'src/users/models/user.schema';

export enum AdminTransactionType {
  USER_PAYMENT = 'user_payment',
  EDITOR_PAYOUT = 'editor_payout',
  WITHDRAWAL_FEE = 'withdrawal_fee',
  REFUND = 'refund',
  WELCOME_BONUS = 'welcome_bonus',
}

export enum TransactionFlow {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

@Schema({ timestamps: true, collection: 'AdminTransactions' })
export class AdminTransaction extends Document {
  @Prop({ type: String, enum: TransactionFlow, required: true })
  flow: TransactionFlow;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: AdminTransactionType, required: true })
  transactionType: AdminTransactionType;

  @Prop({ type: Types.ObjectId, ref: User.name })
  user?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  editor?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Quotation.name })
  quotation?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  commission: number;

  @Prop({ type: String })
  razorpayPaymentId?: string;

  @Prop({ type: String })
  razorpayTransferId?: string;
}

export const AdminTransactionSchema = SchemaFactory.createForClass(AdminTransaction);