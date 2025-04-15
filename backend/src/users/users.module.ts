import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { EditorRequestSchema } from 'src/common/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports:[
    MongooseModule.forFeature([
      { name:User.name, schema: userSchema},
      { name: 'EditorRequest', schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema}
    ])
  ],
  exports: [UsersService]
})
export class UsersModule {}
