import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admin.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { EditorRequest, EditorRequestSchema } from 'src/common/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';
import { UsersModule } from 'src/users/users.module';
import { IAdminsServiceToken } from './interfaces/admins.service.interface';
import { Report, ReportSchema } from 'src/common/models/report.schema';

@Module({
  providers: [
    {
      provide: IAdminsServiceToken,
      useClass: AdminsService,
    },
  ],
  controllers: [AdminsController],
  imports:[
    UsersModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema },
      { name: User.name, schema: userSchema},
      { name: EditorRequest.name, schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema},
      { name: Report.name, schema: ReportSchema}
    ])
  ],
  exports: [
    IAdminsServiceToken,
    MongooseModule
  ]
})
export class AdminsModule {}
