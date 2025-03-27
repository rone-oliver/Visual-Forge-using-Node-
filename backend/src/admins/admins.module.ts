import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admin.schema';

@Module({
  providers: [AdminsService],
  controllers: [AdminsController],
  imports:[
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema }
    ])
  ],
  exports: [AdminsService, MongooseModule]
})
export class AdminsModule {}
