import { Module } from '@nestjs/common';
import { WorksService } from './works.service';
import { IWorkServiceToken } from './interfaces/works.service.interface';
import { IWorkRepositoryToken } from './interfaces/works.repository.interface';
import { WorkRepository } from './repositories/work.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Works, workSchema } from 'src/works/models/works.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';

@Module({
  providers: [
    {
      provide: IWorkServiceToken,
      useClass: WorksService,
    },
    {
      provide: IWorkRepositoryToken,
      useClass: WorkRepository
    },
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Works.name, schema: workSchema },
      { name: User.name, schema: userSchema },
      { name: Editor.name, schema: editorSchema },
    ])
  ],
  exports: [IWorkServiceToken, IWorkRepositoryToken]
})
export class WorksModule {}
