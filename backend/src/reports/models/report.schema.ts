import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { User } from "src/users/models/user.schema";

export enum ReportContext {
    CHAT = 'chat',
    QUOTATION = 'quotation'
}

export enum ReportStatus {
    PENDING = 'Pending',
    REVIEWED = 'Reviewed',
    RESOLVED = 'Resolved'
}

export type ReportDocument = Report & Document;

@Schema({ timestamps: true, collection: 'Reports' })
export class Report{
    _id:Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    reporterId: User;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    reportedUserId: User;

    @Prop({ type:String, enum: ReportContext})
    context: ReportContext;

    @Prop({ type: String })
    reason: string;

    @Prop({ type: String })
    additionalContext?: string;

    @Prop({ type: String, enum: ReportStatus, default: ReportStatus.PENDING })
    status?: ReportStatus;

    @Prop({ type: String })
    resolution?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);