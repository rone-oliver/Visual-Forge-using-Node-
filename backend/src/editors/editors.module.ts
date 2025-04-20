import { Module } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Editor, editorSchema } from './models/editor.schema';
import { Quotation, QuotationSchema } from 'src/common/models/quotation.schema';

@Module({
  providers: [EditorsService],
  controllers: [EditorsController],
  imports:[
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name, schema: QuotationSchema}
    ])
  ]
})
export class EditorsModule {}
