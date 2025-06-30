import { Injectable } from "@nestjs/common";
import { IEditorRepository } from "../interfaces/editor.repository.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Editor, EditorDocument } from "../models/editor.schema";
import { Model } from "mongoose";
import { FormattedEditor } from "src/admins/dto/admin.dto";

@Injectable()
export class EditorRepository implements IEditorRepository {
    constructor(
        @InjectModel(Editor.name) private readonly editorModel: Model<EditorDocument>,
    ) { };

    async aggregate(pipeline: any[]): Promise<FormattedEditor[]> {
        return this.editorModel.aggregate(pipeline);
    }

    async countDocuments(filter?: any): Promise<number> {
        return this.editorModel.countDocuments(filter);
    }
}