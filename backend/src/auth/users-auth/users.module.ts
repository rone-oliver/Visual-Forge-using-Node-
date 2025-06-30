import { Module } from '@nestjs/common';
import { UsersAuthController } from './users-auth.controller';
import { UsersAuthService } from './users-auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp/otp.service';
import { Otp, OtpSchema } from 'src/common/models/otp.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { IUsersAuthServiceToken } from './interfaces/usersAuth-service.interface';

@Module({
  imports: [
    PassportModule.register({defaultStrategy:'jwt'}),
    MongooseModule.forFeature([
      { name:Otp.name, schema: OtpSchema}
    ]),
    UsersModule, PassportModule, ConfigModule,
  ],
  controllers: [UsersAuthController],
  providers: [
    {
      provide: IUsersAuthServiceToken,
      useClass: UsersAuthService
    },
    JwtService, OtpService
  ],
  exports: [IUsersAuthServiceToken],
})
export class UsersAuthModule {}
