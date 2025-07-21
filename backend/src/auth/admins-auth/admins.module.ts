import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminsModule } from 'src/admins/admins.module';
import { HashingModule } from 'src/common/hashing/hashing.module';

import { AdminsAuthController } from './admins-auth.controller';
import { AdminsAuthService } from './admins-auth.service';
import { IAdminsAuthServiceToken } from './interfaces/adminsAuth-service.interface';

@Module({
  imports: [AdminsModule, PassportModule, HashingModule],
  providers: [
    {
      provide: IAdminsAuthServiceToken,
      useClass: AdminsAuthService,
    },
    JwtService,
  ],
  controllers: [AdminsAuthController],
})
export class AdminsAuthModule {}
