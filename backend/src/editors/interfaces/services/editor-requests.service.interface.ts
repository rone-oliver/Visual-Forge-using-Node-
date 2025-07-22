import { Types } from 'mongoose';
import { EditorRequest } from 'src/editors/models/editorRequest.schema';

export const IEditorRequestsServiceToken = Symbol('IEditorRequestsService');

export interface IEditorRequestsService {
  getEditorRequests(): Promise<EditorRequest[]>;
  approveEditorRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
  ): Promise<boolean>;
  rejectEditorRequest(
    requestId: Types.ObjectId,
    reason: string,
  ): Promise<boolean>;
  countEditorRequests(): Promise<number>;
  checkEditorRequest(userId: Types.ObjectId): Promise<boolean>;
  deleteEditorRequest(userId: Types.ObjectId): Promise<EditorRequest | null>;
  createEditorRequest(userId: Types.ObjectId): Promise<EditorRequest>;
  findEditorRequest(userId: Types.ObjectId): Promise<EditorRequest | null>;
}
