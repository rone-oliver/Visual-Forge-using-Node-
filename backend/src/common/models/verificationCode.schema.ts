import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type VerificationCodeDocument = VerificationCode & Document;

export enum VerificationType {
  EMAIL = 'email',
  PASSWORD_RESET = 'passwordReset',
  PHONE = 'phone'
}

@Schema({ timestamps: true })
export class VerificationCode {
  _id: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  email?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ required: true })
  expiry: Date;

  @Prop({ type: String, enum: VerificationType, required: true })
  type: VerificationType;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);