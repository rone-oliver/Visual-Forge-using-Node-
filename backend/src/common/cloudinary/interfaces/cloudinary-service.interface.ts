import { FileUploadResultDto } from "../dtos/cloudinary.dto";

export const ICloudinaryServiceToken = Symbol('ICloudinaryService');

export interface ICloudinaryService {
    uploadFile(file: Express.Multer.File, folder?: string): Promise<FileUploadResultDto>;
    uploadFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResultDto[]>;
}