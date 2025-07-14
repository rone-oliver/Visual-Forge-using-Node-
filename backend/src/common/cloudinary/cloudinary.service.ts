import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { FileType, FileUploadResultDto } from './dtos/cloudinary.dto';
import { ICloudinaryService } from './interfaces/cloudinary-service.interface';

@Injectable()
export class CloudinaryService implements ICloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private configService: ConfigService) {
        // Initialize Cloudinary with credentials from config
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
            secure: true
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder = 'Visual Forge'
    ): Promise<FileUploadResultDto> {
        try {
            const fileType = this.determineFileType(file.mimetype);
            const resourceType = this.getResourceType(fileType);

            // Create a readable stream from the buffer
            const stream = new Readable();
            stream.push(file.buffer);
            stream.push(null); // Mark the end of the stream

            // Create a promise to handle the upload
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: resourceType,
                        // Add specific options based on file type
                        ...this.getUploadOptions(fileType)
                    },
                    (error, result) => {
                        if (error) {
                            this.logger.error(`Error uploading file: ${error.message}`);
                            return reject(error);
                        }

                        if (result) {
                            resolve({
                                fileType,
                                fileName: file.originalname,
                                size: file.size,
                                mimeType: file.mimetype,
                                uploadedAt: new Date(result.created_at),
                                uniqueId: result.public_id,
                                format: result.format,
                                timestamp: result.version
                            });
                        } else {
                            this.logger.error('Cloudinary upload successful, but result is undefined.');
                            return reject(new Error('Cloudinary upload successful, but result is undefined.'));
                        }
                    }
                );

                // Pipe the file buffer to the upload stream
                stream.pipe(uploadStream);
            });
        } catch (error) {
            this.logger.error(`Error in uploadFile: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload multiple files to Cloudinary
     */
    async uploadFiles(
        files: Express.Multer.File[],
        folder
    ): Promise<FileUploadResultDto[]> {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file, folder));
            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error(`Error in uploadFiles: ${error.message}`);
            throw error;
        }
    }

    async deleteFile(publicId: string, fileType: FileType): Promise<{ result: string }> {
        try {
            const resourceType = this.getResourceType(fileType);
            const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            this.logger.log(`Successfully deleted file from Cloudinary: ${publicId}`);
            return result;
        } catch (error) {
            this.logger.error(`Error deleting file ${publicId} from Cloudinary: ${error.message}`);
            throw error;
        }
    }

    /**
     * Determine file type based on MIME type
     */
    private determineFileType(mimeType: string): FileType {
        if (mimeType.startsWith('image/')) {
            return FileType.IMAGE;
        } else if (mimeType.startsWith('video/')) {
            return FileType.VIDEO;
        } else if (mimeType.startsWith('audio/')) {
            return FileType.AUDIO;
        } else {
            return FileType.DOCUMENT;
        }
    }

    private getResourceType(fileType: FileType): UploadApiResponse['resource_type'] {
        switch (fileType) {
            case FileType.IMAGE:
                return 'image';
            case FileType.VIDEO:
                return 'video';
            case FileType.AUDIO:
                return 'video';
            case FileType.DOCUMENT:
                return 'raw';
            default:
                return 'auto';
        }
    }

    private getUploadOptions(fileType: FileType): Record<string, any> {
        const commonOptions = {
            signed: true,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            timestamp: Math.round(new Date().getTime() / 1000)
        };

        switch (fileType) {
            case FileType.VIDEO:
                return {
                    ...commonOptions,
                    chunk_size: 6000000, // 6MB chunks for videos
                    eager: [
                        { format: 'mp4', transformation: [{ quality: 'auto' }] }
                    ],
                    eager_async: true,
                    resource_type: 'video',
                    access_mode: 'public',
                    tags: ['video', 'quotation']
                };
            case FileType.AUDIO:
                return {
                    ...commonOptions,
                    resource_type: 'video', // Audio files use video resource type
                    eager: [
                        { format: 'mp3', transformation: [{ quality: 'auto' }] }
                    ],
                    eager_async: true,
                    access_mode: 'public',
                    tags: ['audio', 'quotation']
                };
            case FileType.IMAGE:
                return {
                    ...commonOptions,
                    eager: [
                        { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
                    ],
                    eager_async: true,
                    resource_type: 'image',
                    access_mode: 'public',
                    tags: ['image', 'quotation'],
                    transformation: [
                        { quality: 'auto:good', fetch_format: 'auto' }
                    ]
                };
            default:
                return commonOptions;
        }
    }
}
