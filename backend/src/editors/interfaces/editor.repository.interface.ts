import { FormattedEditor } from "src/admins/dto/admin.dto";
import { Editor, EditorDocument } from "../models/editor.schema";
import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { UserRatingForEditorDto } from "src/users/dto/users.dto";

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
    findByUserId(userId: Types.ObjectId): Promise<Editor | null>;
    findByUserIdAndUpdate(userId: Types.ObjectId, update: UpdateQuery<Editor>): Promise<Editor | null>;
    getEditorRating(userId: Types.ObjectId): Promise<Editor | null>;
    getEditorUserCombined(userId: Types.ObjectId): Promise<Editor | null>;
    getPublicEditors(pipeline: any[]): Promise<any[]>;
    findMany(filter: FilterQuery<Editor>): Promise<Editor[] | null>;
}