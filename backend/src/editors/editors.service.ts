import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Editor, EditorDocument } from './models/editor.schema';
import { Model } from 'mongoose';

@Injectable()
export class EditorsService {
    constructor(@InjectModel(Editor.name) private editorModel: Model<EditorDocument>) { };

    async createEditor(editor: Partial<Editor>): Promise<Editor>{
        return this.editorModel.create(editor);
    }
}
