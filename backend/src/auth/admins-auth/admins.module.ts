import { Module } from '@nestjs/common';
import { AdminsAuthService } from './admins-auth.service';
import { AdminsAuthController } from './admins-auth.controller';
import { AdminsModule } from 'src/admins/admins.module';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { IAdminsAuthServiceToken } from './interfaces/adminsAuth-service.interface';

@Module({
  imports: [AdminsModule, PassportModule],
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
