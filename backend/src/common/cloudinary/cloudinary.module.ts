import { Module } from '@nestjs/common';
import { ICloudinaryServiceToken } from './interfaces/cloudinary-service.interface';
import { CloudinaryService } from './cloudinary.service';

@Module({
    providers: [
        {
            provide: ICloudinaryServiceToken,
            useClass: CloudinaryService
        }
    ],
    exports: [ICloudinaryServiceToken]
})
export class CloudinaryModule {}
