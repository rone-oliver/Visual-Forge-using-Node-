import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum EditorRequestStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected'
}

export enum Categories {
    VIDEO = 'Video',
    AUDIO = 'Audio',
    IMAGE = 'Image'
}

export type EditorRequestDocument = EditorRequest & Document;

@Schema({ timestamps: true,collection: 'editorRequests'})
export class EditorRequest {
    _id: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId;

    // mock default value for testing
    @Prop({ required: true, enum: Categories, default: Categories.VIDEO, type: String})
    categories: Categories;

    @Prop({ default: EditorRequestStatus.PENDING, enum: EditorRequestStatus })
    status: EditorRequestStatus;

    @Prop({ type: String, trim: true })
    reason?: string;

    @Prop({ type: Types.ObjectId, ref: 'Admin'})
    approvedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

export const EditorRequestSchema = SchemaFactory.createForClass(EditorRequest);

EditorRequestSchema.index({ userId: 1, categories: 1 }, { unique: true });