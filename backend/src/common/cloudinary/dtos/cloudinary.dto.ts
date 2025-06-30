export interface FileUploadResultDto {
    url: string;
    fileType: FileType;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}

export enum FileType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document'
}

// export interface UploadApiResponse {
//     url: string;
//     secure_url: string;
//     public_id: string;
//     format: string;
//     resource_type: 'image' | 'video' | 'raw' | 'auto';
// }