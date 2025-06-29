import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { IAiServiceToken } from './interfaces/ai-service.interface';

@Module({
  providers: [
    {
      provide: IAiServiceToken,
      useClass: AiService
    }
  ],
  exports: [IAiServiceToken],
})
export class AiModule {}
