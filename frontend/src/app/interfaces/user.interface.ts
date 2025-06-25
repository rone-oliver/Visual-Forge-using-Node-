export interface User {
    _id: string;
    username: string;
    fullname: string;
    profileImage: string;
    about: string;
    email: string;
    isEditor: boolean;
    isBlocked: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    language: string;
    gender: string;
    mobileNumber: string;
    age: number;
    behaviourRating: number;
    editorDetails?: EditorDetails;
}

enum EditorRequestStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected'
}

export enum Language {
    ENGLISH = 'English',
    SPANISH = 'Spanish',
    FRENCH = 'French',
    GERMAN = 'German',
    HINDI = 'Hindi'
}

export enum Categories {
    VIDEO = 'Video',
    AUDIO = 'Audio',
    IMAGE = 'Image'
}

export interface EditorDetails {
    category?: string[];
    score?: number;
    ratingsCount?: number;
    sharedTutorials?: string[];
    tipsAndTricks?: string;
    averageRating?: number;
    followersCount?: number;
    followingCount?: number;
    socialLinks?: {
        linkedIn?: string;
        pinterest?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
    };
    createdAt: Date;
}

export interface EditorRequest {
    _id: string;
    userId: string;
    fullname: string;
    email: string;
    categories: Categories;
    createdAt: string;
    status: EditorRequestStatus;
    reason?: string;
}

export interface EditorPublicProfile {
    _id: string;
    username: string;
    fullname: string;
    profileImage: string;
    score: number;
    averageRating: number;
    categories: string[];
    about: string;
    sharedTutorials: string[];
    tipsAndTricks: string;
    socialLinks?: {
        linkedIn?: string;
        pinterest?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
    };
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
}

// export interface EditorProfile {
//     portfolio?: string;
//     specialties?: string[];
// }

export interface GetPublicEditorsDto {
  search?: string;
  category?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

export interface PublicEditorProfile {
  _id: string;
  fullname: string;
  username: string;
  profileImage?: string;
  category: string[];
  score: number;
  averageRating: number;
  isVerified: boolean;
}

export interface PaginatedPublicEditors {
  data: PublicEditorProfile[];
  total: number;
  page: number;
  limit: number;
}