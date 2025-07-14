import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { IHashingServiceToken } from './interfaces/hashing.service.interface';

@Module({
  providers: [
    {
      provide: IHashingServiceToken,
      useClass: HashingService,
    }
  ],
  exports: [IHashingServiceToken],
})
export class HashingModule {}