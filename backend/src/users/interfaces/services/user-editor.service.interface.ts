import { Types } from 'mongoose';
import {
  EditorPublicProfileResponseDto,
  EditorRequestStatusResponseDto,
  GetPublicEditorsDto,
  PaginatedPublicEditorsDto,
  RateEditorDto,
  SuccessResponseDto,
  UserRatingForEditorDto,
} from 'src/users/dto/users.dto';

export const IUserEditorServiceToken = Symbol('IUserEditorService');

export interface IUserEditorService {
  requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto>;
  getEditorRequestStatus(
    userId: Types.ObjectId,
  ): Promise<EditorRequestStatusResponseDto>;
  getPublicEditors(
    params: GetPublicEditorsDto,
  ): Promise<PaginatedPublicEditorsDto>;
  getPublicEditorProfile(
    editorId: string,
    currentUserId?: string,
  ): Promise<EditorPublicProfileResponseDto>;
}
