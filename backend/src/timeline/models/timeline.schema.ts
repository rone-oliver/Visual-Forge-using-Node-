import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Quotation } from 'src/quotation/models/quotation.schema';
import { User } from 'src/users/models/user.schema';

export enum TimelineEvent {
  QUOTATION_CREATED = 'QUOTATION_CREATED',
  EDITOR_ASSIGNED = 'EDITOR_ASSIGNED',
  WORK_STARTED = 'WORK_STARTED',
  FIRST_DRAFT_SUBMITTED = 'FIRST_DRAFT_SUBMITTED',
  FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED',
  WORK_REVISED = 'WORK_REVISED',
  USER_SATISFIED = 'USER_SATISFIED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
}

export type TimelineDocument = Timeline & Document;

@Schema({ timestamps: true })
export class Timeline {
  @Prop({ type: Types.ObjectId, ref: Quotation.name, required: true, index: true })
  quotationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  editorId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TimelineEvent),
    required: true,
  })
  event: TimelineEvent;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>; // For extra data like feedback text
}

export const TimelineSchema = SchemaFactory.createForClass(Timeline);