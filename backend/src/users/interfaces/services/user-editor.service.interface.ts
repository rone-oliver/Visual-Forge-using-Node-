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
  rateEditor(
    userId: Types.ObjectId,
    rateEditorDto: RateEditorDto,
  ): Promise<SuccessResponseDto>;
  getPublicEditors(
    params: GetPublicEditorsDto,
  ): Promise<PaginatedPublicEditorsDto>;
  getPublicEditorProfile(
    editorId: string,
    currentUserId?: string,
  ): Promise<EditorPublicProfileResponseDto>;
  getCurrentEditorRating(
    userId: Types.ObjectId,
    editorId: string,
  ): Promise<UserRatingForEditorDto | null>;
}
