import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true})
export class Admin {
    @Prop({ type: String, required: true, unique: true, trim: true, match: /^[a-zA-Z0-9_]+$/ })
    username: string;

    @Prop({type: String, required: true})
    password: string;
}

export const adminSchema = SchemaFactory.createForClass(Admin);