import { Types } from "mongoose";

export interface Rating{
    rating: number;
    feedback?: string;
    userId: Types.ObjectId;
}