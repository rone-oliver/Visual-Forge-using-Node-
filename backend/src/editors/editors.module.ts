import { Module } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Editor, editorSchema } from './models/editor.schema';
import { Quotation, QuotationSchema } from 'src/common/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/common/models/works.schema';

@Module({
  providers: [EditorsService, CloudinaryService],
  controllers: [EditorsController],
  imports:[
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name, schema: QuotationSchema},
      { name: Works.name, schema: workSchema},
    ])
  ]
})
export class EditorsModule {}
