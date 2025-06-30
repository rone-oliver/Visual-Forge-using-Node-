import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Rating } from "../dto/editors.dto";

export type EditorDocument = Editor & Document;

@Schema({ timestamps: true })
export class Editor {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, unique: true, required:true, ref:'User' })
  userId: Types.ObjectId;
  
  @Prop({ type: [String] })
  category?: string[];

  @Prop({ type: Number, default: 0 })
  score?: number;

  @Prop({ type: Number, default: 0 })
  streak?: number;

  @Prop({ type: Number, default: 0})
  avgTime?: number;

  @Prop({
    type: [{
      rating: { type: Number, min:1, max:5, required: true },
      feedback: { type: String },
      userId: { type: Types.ObjectId, ref: 'User', required: true }
    }],
    default: []
  })
  ratings?: Rating[];

  @Prop({type: Object, default: {}})
  socialLinks?: {
    linkedIn?:string,
    pinterest?:string,
    instagram?:string,
    facebook?:string,
    website?:string
  }

  @Prop({ type: [String], default: [] })
  sharedTutorials?: string[];

  @Prop({ type: String, default: '' })
  tipsAndTricks?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const editorSchema = SchemaFactory.createForClass(Editor);