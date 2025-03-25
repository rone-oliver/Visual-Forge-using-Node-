import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Rating } from "../interfaces/rating.interface";

export type EditorDocument = Editor & Document;

@Schema({ timestamps: true })
export class Editor {
  @Prop({ type: Types.ObjectId, required:true, ref:'User' })
  userId: Types.ObjectId;
  @Prop({ type: [String] })
  category?: string[];

  @Prop({ type: Number, default: 0 })
  score?: number;

  @Prop({
    type: [{
      rating: { type: Number, required: true },
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
}

export const editorSchema = SchemaFactory.createForClass(Editor);