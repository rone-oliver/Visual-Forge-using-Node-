import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { FileType } from "./quotation.schema";

export type WorksDocument = Works & Document;

@Schema()
class FileAttachment {
    @Prop({ required: true })
    url: string;

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

@Schema({ timestamps: true, collection: 'Works'})
export class Works {
    _id: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Editor'})
    editorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId;

    @Prop({ type: [{ type: FileAttachment }] , required: true})
    finalFiles: FileAttachment[];

    @Prop({ type: String, trim: true})
    comments: string;

    @Prop({ type: Boolean, default: false})
    isPublic: boolean;

    @Prop({ type: Number, min: 1, max: 5})
    rating: number;

    @Prop({ type: String, trim: true})
    feedback?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const workSchema = SchemaFactory.createForClass(Works);