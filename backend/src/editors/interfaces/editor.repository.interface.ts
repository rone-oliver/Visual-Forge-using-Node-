import { FormattedEditor } from "src/admins/dto/admin.dto";
import { Editor } from "../models/editor.schema";

export const IEditorRepositoryToken = Symbol('IEditorRepository');

export interface IEditorRepository {
    aggregate(pipeline: any[]): Promise<FormattedEditor[]>;
    countDocuments(filter?: any): Promise<number>;
}