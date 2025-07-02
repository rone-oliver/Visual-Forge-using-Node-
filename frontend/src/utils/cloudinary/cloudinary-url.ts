import { FileType } from "../../app/interfaces/quotation.interface";

export class CloudinaryUrlBuilder {
    private static readonly CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dt5t71imx/';
    private static readonly RESOURCE_TYPES = {
        'image': 'image',
        'video': 'video',
        'audio': 'video',
        'document': 'raw'
    };

    static buildUrl(fileAttachment: {
        uniqueId: string;
        timestamp: number;
        fileType: FileType;
        folderPath?: string;
    }): string {
        const resourceType = this.RESOURCE_TYPES[fileAttachment.fileType];
        // const folderPath = fileAttachment.folderPath || 'Visual%20Forge';
        
        return `${this.CLOUDINARY_BASE_URL}${resourceType}/upload/v${fileAttachment.timestamp}/${fileAttachment.uniqueId}`;
    }
}