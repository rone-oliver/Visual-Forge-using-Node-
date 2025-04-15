import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type WorksDocument = Works & Document;

@Schema({ timestamps: true, collection: 'Works'})
export class Works {
    _id: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Editor'})
    editorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId;

    @Prop({ type: Array, required: true})
    finalFiles: string[];

    @Prop({ type: String, trim: true})
    comments: string;

    @Prop({ type: Boolean, default: false})
    isPublic: Boolean;

    @Prop({ type: Number, min: 1, max: 5})
    rating: number;

    @Prop({ type: String, trim: true})
    feedback?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const workSchema = SchemaFactory.createForClass(Works);