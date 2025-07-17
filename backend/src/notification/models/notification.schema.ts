import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    GENERAL = 'general',
    CHAT = 'chat',
    WORK = 'work',
    PAYMENT = 'payment',
    QUOTATION_EXPIRED = 'quotation_expired',
    ACCOUNT_SUSPENDED = 'suspended',
    EDITOR_WARNING = 'warning',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, required: true })
    message: string;

    @Prop({ type: Boolean, default: true })
    unread: boolean;

    @Prop({ type: String, enum: NotificationType, default: NotificationType.GENERAL })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: 'Quotation' })
    quotationId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Works' })
    worksId?: Types.ObjectId;

    @Prop({ type: Object })
    data?: any;

    createdAt: Date;
    updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);