import { FileType, FileUploadResultDto } from '../dtos/cloudinary.dto';

export const ICloudinaryServiceToken = Symbol('ICloudinaryService');

export interface ICloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<FileUploadResultDto>;
  uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<FileUploadResultDto[]>;
  deleteFile(publicId: string, fileType: FileType): Promise<{ result: string }>;
  generateUploadSignature(): { timestamp: number, signature: string, uploadPreset: string };
}
