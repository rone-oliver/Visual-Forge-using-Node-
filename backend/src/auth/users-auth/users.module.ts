import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Otp, OtpSchema } from 'src/auth/users-auth/models/otp.schema';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { EditorsModule } from 'src/editors/editors.module';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';

import { IOtpRepositoryToken } from './interfaces/otp.repository.interface';
import { IOtpServiceToken } from './interfaces/otp.service.interface';
import { IUsersAuthServiceToken } from './interfaces/usersAuth-service.interface';
import { OtpService } from './otp/otp.service';
import { OtpRepository } from './repositories/otp.repository';
import { UsersAuthController } from './users-auth.controller';
import { UsersAuthService } from './users-auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    UsersModule,
    PassportModule,
    ConfigModule,
    EditorsModule,
    MailModule,
    HashingModule,
  ],
  controllers: [UsersAuthController],
  providers: [
    {
      provide: IUsersAuthServiceToken,
      useClass: UsersAuthService,
    },
    {
      provide: IOtpServiceToken,
      useClass: OtpService,
    },
    {
      provide: IOtpRepositoryToken,
      useClass: OtpRepository,
    },
    JwtService,
  ],
  exports: [IUsersAuthServiceToken],
})
export class UsersAuthModule {}
