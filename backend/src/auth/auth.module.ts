import { Module } from '@nestjs/common';
import { AuthController } from './common/common.controller';
import { CommonService } from './common/common.service';
import { Preference, PreferenceSchema } from 'src/common/models/userPreference.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [CommonService, JwtService, AuthGuard],
  exports: [CommonService, JwtService],
  imports:[
      MongooseModule.forFeature([
        { name:Preference.name, schema: PreferenceSchema}
      ]),
      UsersModule
    ],
})
export class AuthModule {}