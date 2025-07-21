import { Module } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';
import { ICloudinaryServiceToken } from './interfaces/cloudinary-service.interface';

@Module({
  providers: [
    {
      provide: ICloudinaryServiceToken,
      useClass: CloudinaryService,
    },
  ],
  exports: [ICloudinaryServiceToken],
})
export class CloudinaryModule {}
