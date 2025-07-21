import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type PreferenceDocument = Document & Preference;

class Preferences {
  @Prop({ enum: ['dark', 'light'], default: 'light' })
  theme?: 'dark' | 'light';
}

@Schema({ timestamps: true })
export class Preference {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Preferences, default: {} })
  preferences: Preferences;
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);
