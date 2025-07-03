import { Types } from "mongoose";
import { EditorRequest } from "../models/editorRequest.schema";

export const IEditorRequestsRepositoryToken = Symbol('IEditorRequestsRepository');

export interface IEditorRequestsRepository{
    getEditorRequests(): Promise<EditorRequest[]>;
    approveEditorRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<EditorRequest | null>;
    rejectEditorRequest(requestId: Types.ObjectId, reason: string): Promise<EditorRequest | null>;
    countEditorRequests(): Promise<number>;
    create(userId: Types.ObjectId): Promise<EditorRequest>;
    findOne(userId: Types.ObjectId): Promise<EditorRequest | null>;
}