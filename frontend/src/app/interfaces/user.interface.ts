export interface User {
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
    averageRating?: number;
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