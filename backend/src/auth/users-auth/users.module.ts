import { Module } from '@nestjs/common';
import { UsersAuthController } from './users-auth.controller';
import { UsersAuthService } from './users-auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp/otp.service';
import { Otp, OtpSchema } from 'src/auth/users-auth/models/otp.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { IUsersAuthServiceToken } from './interfaces/usersAuth-service.interface';
import { IOtpServiceToken } from './interfaces/otp.service.interface';
import { IOtpRepositoryToken } from './interfaces/otp.repository.interface';
import { OtpRepository } from './repositories/otp.repository';

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
    {
      provide: IOtpServiceToken,
      useClass: OtpService
    },
    {
      provide: IOtpRepositoryToken,
      useClass: OtpRepository
    },
    JwtService,
  ],
  exports: [IUsersAuthServiceToken],
})
export class UsersAuthModule {}
