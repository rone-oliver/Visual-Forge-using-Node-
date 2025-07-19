import { Module } from '@nestjs/common';
import { AdminsAuthService } from './admins-auth.service';
import { AdminsAuthController } from './admins-auth.controller';
import { AdminsModule } from 'src/admins/admins.module';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { IAdminsAuthServiceToken } from './interfaces/adminsAuth-service.interface';
import { HashingModule } from 'src/common/hashing/hashing.module';

@Module({
  imports: [AdminsModule, PassportModule, HashingModule,],
  providers: [
    {
      provide: IAdminsAuthServiceToken,
      useClass: AdminsAuthService
    },
    JwtService
  ],
  controllers: [AdminsAuthController],
})
export class AdminsAuthModule {}
