import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read'
}

export type MessagesDocument = Message & Document;

@Schema({ timestamps: true, collection: 'Messages'})
export class Message {
    _id: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: "User" })
    sender: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: "User" })
    recipient: Types.ObjectId;

    @Prop({ required: true, type: String, trim: true })
    content: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;
    
    @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
    status: MessageStatus;

    createdAt: Date;
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);