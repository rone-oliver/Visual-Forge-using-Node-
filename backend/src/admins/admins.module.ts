import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admin.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { EditorRequest, EditorRequestSchema } from 'src/common/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';

@Module({
  providers: [AdminsService],
  controllers: [AdminsController],
  imports:[
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema },
      { name: User.name, schema: userSchema},
      { name: EditorRequest.name, schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema}
    ])
  ],
  exports: [AdminsService, MongooseModule]
})
export class AdminsModule {}
