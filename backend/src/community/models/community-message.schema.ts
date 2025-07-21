import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/models/user.schema';

import { Community } from './community.schema';

export type CommunityMessageDocument = CommunityMessage & Document;

@Schema({ timestamps: true, collection: 'CommunityMessages' })
export class CommunityMessage {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Community.name, required: true })
  community: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  content: string;
}

export const CommunityMessageSchema =
  SchemaFactory.createForClass(CommunityMessage);
