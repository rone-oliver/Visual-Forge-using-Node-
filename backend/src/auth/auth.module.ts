import { Module } from '@nestjs/common';
import { AuthController } from './common/common.controller';
import { CommonService } from './common/common.service';
import { Preference, PreferenceSchema } from 'src/common/models/userPreference.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import { ICommonServiceToken } from './common/interfaces/common-service.interface';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: ICommonServiceToken,
      useClass: CommonService
    },
    AuthGuard, RolesGuard
  ],
  exports: [ICommonServiceToken, AuthGuard, RolesGuard],
  imports:[
      MongooseModule.forFeature([
        { name:Preference.name, schema: PreferenceSchema}
      ]),
      UsersModule,
      JwtModule.register({ global: true })
    ],
})
export class AuthModule {}