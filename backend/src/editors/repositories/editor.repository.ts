import { Injectable, NotFoundException } from "@nestjs/common";
import { IEditorRepository } from "../interfaces/editor.repository.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Editor, EditorDocument } from "../models/editor.schema";
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { FormattedEditor } from "src/admins/dto/admin.dto";

@Injectable()
export class EditorRepository implements IEditorRepository {
    constructor(
        @InjectModel(Editor.name) private readonly _editorModel: Model<EditorDocument>,
    ) { };

    async aggregate(pipeline: any[]): Promise<FormattedEditor[]> {
        return this._editorModel.aggregate(pipeline);
    }

    async countDocuments(filter?: any): Promise<number> {
        return this._editorModel.countDocuments(filter);
    }

    async create(editor: Partial<Editor>): Promise<Editor> {
        return this._editorModel.create(editor);
    }

    async findByUserId(userId: Types.ObjectId | string): Promise<EditorDocument | null> {
        return this._editorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    }

    async findByUserIdAndLean(userId: Types.ObjectId | string): Promise<Editor | null> {
        return this._editorModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
    }

    async update(id: Types.ObjectId, update: Partial<Editor>): Promise<Editor | null> {
        return this._editorModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    async updateScore(editorId: Types.ObjectId, score: number, streak: number): Promise<void> {
        await this._editorModel.updateOne({ _id: editorId }, { $set: { score, streak } });
    }

    async addSharedTutorial(userId: string, tutorialUrl: string): Promise<Editor> {
        const updatedEditor = await this._editorModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $addToSet: { sharedTutorials: tutorialUrl } },
            { new: true }
        ).exec();

        if (!updatedEditor) {
            throw new NotFoundException(`Editor with user ID ${userId} not found.`);
        }

        return updatedEditor;
    }

    async removeSharedTutorial(userId: string, tutorialUrl: string): Promise<Editor> {
        const updatedEditor = await this._editorModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $pull: { sharedTutorials: tutorialUrl } },
            { new: true }
        ).exec();

        if (!updatedEditor) {
            throw new NotFoundException(`Editor with user ID ${userId} not found.`);
        }

        return updatedEditor;
    }

    async findByUserIdAndUpdate(userId: Types.ObjectId, update: UpdateQuery<Editor>): Promise<Editor | null> {
        return this._editorModel.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, update, { new: true }).exec();
    }

    async getEditorRating(userId: Types.ObjectId): Promise<Editor | null> {
        return this._editorModel.findOne({ userId: new Types.ObjectId(userId) }).select('ratings').lean();
    }

    async getEditorUserCombined(userId: Types.ObjectId): Promise<Editor | null> {
        return this._editorModel.findOne({ userId: new Types.ObjectId(userId) }).populate('userId').lean();
    }

    async getPublicEditors(pipeline: any[]): Promise<any[]> {
        return this._editorModel.aggregate(pipeline);
    }

    async findMany(filter: FilterQuery<Editor>): Promise<Editor[] | null> {
        return this._editorModel.find(filter).exec();
    }
}