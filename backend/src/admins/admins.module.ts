import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EditorsModule } from 'src/editors/editors.module';
import { QuotationModule } from 'src/quotation/quotation.module';
import { ReportsModule } from 'src/reports/reports.module';
import { UsersModule } from 'src/users/users.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { WorksModule } from 'src/works/works.module';

import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { IAdminRepositoryToken } from './interfaces/admins.repository.interface';
import { IAdminsServiceToken } from './interfaces/admins.service.interface';
import { Admin, adminSchema } from './models/admin.schema';
import { AdminRepository } from './repositories/admin.repository';

@Module({
  providers: [
    {
      provide: IAdminsServiceToken,
      useClass: AdminsService,
    },
    {
      provide: IAdminRepositoryToken,
      useClass: AdminRepository,
    },
  ],
  controllers: [AdminsController],
  imports: [
    UsersModule,
    QuotationModule,
    EditorsModule,
    ReportsModule,
    MongooseModule.forFeature([{ name: Admin.name, schema: adminSchema }]),
    WalletModule,
    WorksModule,
  ],
  exports: [IAdminsServiceToken, MongooseModule],
})
export class AdminsModule {}
