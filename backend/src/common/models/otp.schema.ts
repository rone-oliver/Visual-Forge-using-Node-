import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
    @Prop({ required: true })
    email:string;

    @Prop({ required: true })
    otp: string;

    @Prop({ required: true })
    expiresAt: Date;

    @Prop({ default: false })
    isVerified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({expiresAt: 1},{expireAfterSeconds:0})