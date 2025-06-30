import { Module } from '@nestjs/common';
import { AuthController } from './common/common.controller';
import { CommonService } from './common/common.service';
import { Preference, PreferenceSchema } from 'src/common/models/userPreference.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import { ICommonServiceToken } from './common/interfaces/common-service.interface';
import { TokenRefreshController } from './token-refresh/token-refresh.controller';
import { ITokenRefreshServiceToken } from './token-refresh/interfaces/tokenRefresh-service.interface';
import { TokenRefreshService } from './token-refresh/token-refresh.service';

@Module({
  controllers: [AuthController, TokenRefreshController],
  providers: [
    {
      provide: ICommonServiceToken,
      useClass: CommonService
    },
    {
      provide: ITokenRefreshServiceToken,
      useClass: TokenRefreshService
    },
    AuthGuard, RolesGuard
  ],
  exports: [ICommonServiceToken, AuthGuard, RolesGuard],
  imports:[
      MongooseModule.forFeature([
        { name:Preference.name, schema: PreferenceSchema}
      ]),
      UsersModule
    ],
})
export class AuthModule {}