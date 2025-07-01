import { FormattedEditor } from "src/admins/dto/admin.dto";
import { Editor, EditorDocument } from "../models/editor.schema";
import { Types } from "mongoose";

export const IEditorRepositoryToken = Symbol('IEditorRepository');

export interface IEditorRepository {
    aggregate(pipeline: any[]): Promise<FormattedEditor[]>;
    countDocuments(filter?: any): Promise<number>;
    create(editor: Partial<Editor>): Promise<Editor>;
    findByUserId(userId: Types.ObjectId | string): Promise<EditorDocument | null>;
    findByUserIdAndLean(userId: Types.ObjectId | string): Promise<Editor | null>;
    update(id: Types.ObjectId, update: Partial<Editor>): Promise<Editor | null>;
    updateScore(editorId: Types.ObjectId, score: number, streak: number): Promise<void>;
    addSharedTutorial(userId: string, tutorialUrl: string): Promise<Editor>;
    removeSharedTutorial(userId: string, tutorialUrl: string): Promise<Editor>;
}