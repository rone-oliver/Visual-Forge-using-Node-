import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { FileType } from '../../quotation/models/quotation.schema';

export type WorksDocument = Works & Document;

@Schema()
export class FileAttachment {
  @Prop()
  url?: string;

  @Prop({ required: true })
  uniqueId: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true, enum: FileType, type: String })
  fileType: FileType;

  @Prop()
  fileName: string;

  @Prop()
  size?: number;

  @Prop()
  mimeType?: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

@Schema({ timestamps: true, collection: 'Works' })
export class Works {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Editor' })
  editorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: FileAttachment }], required: true })
  finalFiles: FileAttachment[];

  @Prop({ type: String, trim: true })
  comments: string;

  @Prop({ type: Boolean, default: false })
  isPublic: boolean;

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number;

  @Prop({ type: Number, min: 1, max: 5 })
  editorRating: number;

  @Prop({ type: String, trim: true })
  feedback?: string;

  @Prop({ type: Boolean, default: false })
  isSatisfied: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const workSchema = SchemaFactory.createForClass(Works);
