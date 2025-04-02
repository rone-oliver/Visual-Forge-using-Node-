import { Module } from '@nestjs/common';
import { AuthController } from './common/common.controller';
import { CommonService } from './common/common.service';

@Module({
  controllers: [AuthController],
  providers: [CommonService],
  exports: [CommonService]
})
export class AuthModule {}