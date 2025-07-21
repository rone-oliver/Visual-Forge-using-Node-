import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/models/user.schema';

import { Wallet } from './wallet.schema';

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  CREDIT_FROM_WORK = 'credit_from_work',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  COMPENSATION = 'compensation',
}

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ timestamps: true, collection: 'WalletTransactions' })
export class WalletTransaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  user: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Wallet.name,
    required: true,
  })
  wallet: Wallet;

  @Prop({ required: true, enum: WalletTransactionType })
  type: WalletTransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
