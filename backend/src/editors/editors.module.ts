import { Module } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Editor, editorSchema } from './models/editor.schema';

@Module({
  providers: [EditorsService],
  controllers: [EditorsController],
  imports:[
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema}
    ])
  ]
})
export class EditorsModule {}
