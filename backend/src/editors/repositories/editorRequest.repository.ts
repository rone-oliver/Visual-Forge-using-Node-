import { IEditorRequestsRepository } from "../interfaces/editorRequests.repository.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { EditorRequest, EditorRequestDocument, EditorRequestStatus } from "src/editors/models/editorRequest.schema";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EditorRequestsRepository implements IEditorRequestsRepository {
    constructor(
        @InjectModel(EditorRequest.name) private readonly _editorRequestModel: Model<EditorRequestDocument>
    ) { }

    async countEditorRequests(): Promise<number> {
        return this._editorRequestModel.countDocuments({ status: EditorRequestStatus.PENDING });
    }

    async getEditorRequests(): Promise<EditorRequest[]> {
        return this._editorRequestModel.find({ status: EditorRequestStatus.PENDING }).populate('userId');
    }

    async approveEditorRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<EditorRequest | null> {
        return this._editorRequestModel.findByIdAndUpdate(requestId, { status: EditorRequestStatus.APPROVED, approvedBy: new Types.ObjectId(adminId) }, { new: true });
    }

    async rejectEditorRequest(requestId: Types.ObjectId, reason: string): Promise<EditorRequest | null> {
        return this._editorRequestModel.findByIdAndUpdate(requestId, { status: EditorRequestStatus.REJECTED, reason }, { new: true });
    }

    async create(userId: Types.ObjectId): Promise<EditorRequest> {
        return this._editorRequestModel.create({userId: new Types.ObjectId(userId)});
    }

    async findOne(userId: Types.ObjectId): Promise<EditorRequest | null> {
        return this._editorRequestModel.findOne({userId: new Types.ObjectId(userId)});
    }

    async checkEditorRequest(userId: Types.ObjectId): Promise<boolean> {
        const request = await this._editorRequestModel.findOne({userId: new Types.ObjectId(userId)});
        return request !== null;
    }

    async deleteRequest(userId: Types.ObjectId): Promise<EditorRequest | null> {
        return this._editorRequestModel.findOneAndDelete({userId: new Types.ObjectId(userId)});
    }
}