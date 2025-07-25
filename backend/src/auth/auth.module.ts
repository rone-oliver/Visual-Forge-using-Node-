import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Preference,
  PreferenceSchema,
} from 'src/common/models/userPreference.schema';
import { UsersModule } from 'src/users/users.module';

import { AuthController } from './common/common.controller';
import { CommonService } from './common/common.service';
import { ICommonServiceToken } from './common/interfaces/common-service.interface';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import { ITokenRefreshServiceToken } from './token-refresh/interfaces/tokenRefresh-service.interface';
import { TokenRefreshController } from './token-refresh/token-refresh.controller';
import { TokenRefreshService } from './token-refresh/token-refresh.service';
import { EditorsModule } from 'src/editors/editors.module';

@Module({
  controllers: [AuthController, TokenRefreshController],
  providers: [
    {
      provide: ICommonServiceToken,
      useClass: CommonService,
    },
    {
      provide: ITokenRefreshServiceToken,
      useClass: TokenRefreshService,
    },
    AuthGuard,
    RolesGuard,
  ],
  exports: [ICommonServiceToken, AuthGuard, RolesGuard],
  imports: [
    MongooseModule.forFeature([
      { name: Preference.name, schema: PreferenceSchema },
    ]),
    UsersModule, EditorsModule,
  ],
})
export class AuthModule {}
