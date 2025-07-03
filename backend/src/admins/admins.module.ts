import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admin.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { EditorRequest, EditorRequestSchema } from 'src/editors/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';
import { UsersModule } from 'src/users/users.module';
import { IAdminsServiceToken } from './interfaces/admins.service.interface';
import { Report, ReportSchema } from 'src/reports/models/report.schema';
import { IAdminRepositoryToken } from './interfaces/admins.repository.interface';
import { AdminRepository } from './repositories/admin.repository';
import { IReportsRepositoryToken } from './interfaces/reports.repository.interface';
import { ReportsRepository } from './repositories/reports.repository';
import { QuotationModule } from 'src/quotation/quotation.module';
import { EditorsModule } from 'src/editors/editors.module';

@Module({
  providers: [
    {
      provide: IAdminsServiceToken,
      useClass: AdminsService,
    },
    {
      provide: IAdminRepositoryToken,
      useClass: AdminRepository
    },
    {
      provide: IReportsRepositoryToken,
      useClass: ReportsRepository
    }
  ],
  controllers: [AdminsController],
  imports:[
    UsersModule, QuotationModule, EditorsModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema },
      { name: Report.name, schema: ReportSchema},
    ])
  ],
  exports: [
    IAdminsServiceToken,
    MongooseModule
  ]
})
export class AdminsModule {}
