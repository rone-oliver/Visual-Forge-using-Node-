import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admin.schema';
import { UsersModule } from 'src/users/users.module';
import { IAdminsServiceToken } from './interfaces/admins.service.interface';
import { IAdminRepositoryToken } from './interfaces/admins.repository.interface';
import { AdminRepository } from './repositories/admin.repository';
import { QuotationModule } from 'src/quotation/quotation.module';
import { EditorsModule } from 'src/editors/editors.module';
import { ReportsModule } from 'src/reports/reports.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { WorksModule } from 'src/works/works.module';

@Module({
  providers: [
    {
      provide: IAdminsServiceToken,
      useClass: AdminsService,
    },
    {
      provide: IAdminRepositoryToken,
      useClass: AdminRepository
    }
  ],
  controllers: [AdminsController],
  imports:[
    UsersModule, QuotationModule, EditorsModule, ReportsModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema },
    ]),
    WalletModule, WorksModule,
  ],
  exports: [
    IAdminsServiceToken,
    MongooseModule
  ]
})
export class AdminsModule {}
