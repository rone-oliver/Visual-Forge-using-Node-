import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/users/models/user.schema';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true, collection: 'Wallets' })
export class Wallet {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: User;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
