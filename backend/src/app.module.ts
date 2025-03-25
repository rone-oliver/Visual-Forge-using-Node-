import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { EditorsModule } from './editors/editors.module';
import { UsersModule } from './auth/users/users.module';
import { EditorsModule } from './auth/editors/editors.module';
import { AdminsModule } from './auth/admins/admins.module';
import { UsersAuthService } from './auth/users-auth/users-auth.service';
import { UsersAuthController } from './auth/users-auth/users-auth.controller';

@Module({
  imports: [UsersModule, DatabaseModule, AuthModule, AdminsModule, EditorsModule],
  controllers: [AppController, UsersAuthController],
  providers: [AppService, UsersAuthService],
})
export class AppModule {}
