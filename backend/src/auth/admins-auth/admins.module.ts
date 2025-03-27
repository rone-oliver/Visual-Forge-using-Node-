import { Module } from '@nestjs/common';
import { AdminsAuthService } from './admins-auth.service';
import { AdminsAuthController } from './admins-auth.controller';
import { AdminsModule } from 'src/admins/admins.module';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from 'src/common/config/jwt.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [AdminsModule, PassportModule, JwtConfigModule],
  providers: [AdminsAuthService, JwtService],
  controllers: [AdminsAuthController],
})
export class AdminsAuthModule {}
