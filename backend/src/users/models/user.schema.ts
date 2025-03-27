import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female',
    OTHER = 'Other'
}

export enum Language {
    ENGLISH = 'English',
    SPANISH = 'Spanish',
    FRENCH = 'French',
    GERMAN = 'German',
    HINDI = 'Hindi'
}

@Schema({ timestamps: true })
export class User {
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true, trim: true, match: /^[a-zA-Z0-9_]+$/ })
    username: string;

    @Prop({ required: true, unique: true, match: /^\S+@\S+\.\S+$/ })
    email: string;

    @Prop({ required: true, minlength: 8 })
    password: string;

    @Prop({ required: true, trim: true })
    fullname: string;

    @Prop({
        type: String,
        validate: {
            validator: (v: string) => /^\+?[0-9]{7,15}$/.test(v),
            message: 'Invalid mobile number format'
        }
    })
    mobileNumber?: string;

    @Prop({ type: Boolean, default: false})
    isVerified: boolean;

    @Prop({ type: String, enum: Gender, required: true })
    gender: Gender;

    @Prop({ type: String, enum: Language, required: true, default: Language.ENGLISH })
    language: Language;

    @Prop({
        type: Number,
        min: [1, 'Age must be at least 1'],
        max: [120, 'Age must not exceed 120'],
        validate: {
            validator: Number.isInteger,
            message: 'Age must be an integer'
        }
    })
    age?: number;

    @Prop({ type: String, unique: true, sparse: true }) 
    googleId?: string;

    @Prop({ type: Boolean, default: false })
    isEditor: boolean;

    @Prop({ type: Number, min: 1, max: 5 })
    behaviourRating?: number;
}

export const userSchema = SchemaFactory.createForClass(User);