import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/models/user.schema';

export type CommunityDocument = Community & Document;

@Schema({ timestamps: true, collection: 'Communities' })
export class Community {
  @Prop({ type: String, required: true, trim: true, unique: true })
  name: string;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  creator: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  members: User[];
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
