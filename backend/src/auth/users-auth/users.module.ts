import { Module } from '@nestjs/common';
import { UsersAuthController } from './users-auth.controller';
import { UsersAuthService } from './users-auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from 'src/common/config/jwt.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { OtpService } from './otp/otp.service';
import { Otp, OtpSchema } from 'src/common/models/otp.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({defaultStrategy:'jwt'}),
    MongooseModule.forFeature([
      { name:Otp.name, schema: OtpSchema}
    ]),
    UsersModule, PassportModule, JwtConfigModule, ConfigModule,
  ],
  controllers: [UsersAuthController],
  providers: [UsersAuthService, JwtService, OtpService],
  exports: [UsersAuthService],
})
export class UsersAuthModule {}
