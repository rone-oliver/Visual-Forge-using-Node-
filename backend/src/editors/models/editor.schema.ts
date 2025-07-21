import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Rating } from '../dto/editors.dto';

export type EditorDocument = Editor & Document;

@Schema({ timestamps: true })
export class Editor {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, unique: true, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: [String] })
  category?: string[];

  @Prop({ type: Number, default: 0 })
  score?: number;

  @Prop({ type: Number, default: 0 })
  streak?: number;

  @Prop({ type: Number, default: 0 })
  avgTime?: number;

  @Prop({
    type: [
      {
        rating: { type: Number, min: 1, max: 5, required: true },
        feedback: { type: String },
        userId: { type: Types.ObjectId, ref: 'User', required: true },
      },
    ],
    _id: false,
    default: [],
  })
  ratings?: Rating[];

  @Prop({ type: Object, default: {} })
  socialLinks?: {
    linkedIn?: string;
    pinterest?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };

  @Prop({ type: [String], default: [] })
  sharedTutorials?: string[];

  @Prop({ type: String, default: '' })
  tipsAndTricks?: string;

  @Prop({ type: Number, default: 0 })
  warningCount?: number;

  @Prop({ type: Boolean, default: false })
  isSuspended?: boolean;

  @Prop({ type: Date })
  suspendedUntil?: Date;

  @Prop({ type: Date })
  lastWarningDate?: Date;

  @Prop({ type: Date })
  lastWithdrawnDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const editorSchema = SchemaFactory.createForClass(Editor);

editorSchema.index({ userId: 1, editorId: 1 }, { unique: true });
