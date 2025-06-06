import { Types } from "mongoose";
import { Categories, EditorRequestStatus } from "src/common/models/editorRequest.schema";

export interface GetAllUsersQueryDto {
  isEditor?: boolean;
  gender?: string;
  behaviourRating?: number | string;
  search?: string;
}

export interface GetEditorsQueryDto {
  video?: string; // Expected 'true' or 'false'. Consider transforming to boolean in controller/DTO.
  image?: string; // Expected 'true' or 'false'.
  audio?: string; // Expected 'true' or 'false'.
  rating?: string; // Expected as string, parsed to float. Consider number type with validation.
  search?: string;
}

export interface FormattedEditorRequest {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    fullname: string;
    email: string;
    categories: Categories;
    createdAt: Date;
    status: EditorRequestStatus;
    reason?: string;
}

export interface FormattedEditor {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    fullname: string;
    username: string;
    email: string;
    profileImage?: string;
    category: string[];
    score: number;
    ratingsCount: number;
    averageRating: number;
    createdAt: Date;
    isVerified: boolean;
    isBlocked: boolean;
    socialLinks?: any;
}