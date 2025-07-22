import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { IEditorRequestsRepository, IEditorRequestsRepositoryToken } from "../interfaces/editorRequests.repository.interface";
import { Types } from "mongoose";
import { IEditorRepository, IEditorRepositoryToken } from "../interfaces/editor.repository.interface";
import { IUsersService, IUsersServiceToken } from "src/users/interfaces/users.service.interface";
import { EditorRequest } from "../models/editorRequest.schema";
import { IEditorRequestsService } from "../interfaces/services/editor-requests.service.interface";

@Injectable()
export class EditorRequestsService implements IEditorRequestsService {
    private readonly _logger = new Logger(EditorRequestsService.name);

    constructor(
        @Inject(IEditorRequestsRepositoryToken)
        private readonly _editorRequestRepository: IEditorRequestsRepository,
        @Inject(IEditorRepositoryToken)
        private readonly _editorRepository: IEditorRepository,
        @Inject(IUsersServiceToken)
        private readonly _userService: IUsersService,
    ) { };

    async getEditorRequests(): Promise<EditorRequest[]> {
        return this._editorRequestRepository.getEditorRequests();
    }

    async approveEditorRequest(
        requestId: Types.ObjectId,
        adminId: Types.ObjectId,
    ): Promise<boolean> {
        try {
            const request = await this._editorRequestRepository.approveEditorRequest(
                requestId,
                adminId,
            );
            if (request && request.userId) {
                await this._userService.makeUserEditor(request.userId);
                await this._editorRepository.create({
                    userId: new Types.ObjectId(request.userId),
                    category: [request.categories],
                });
                return true;
            }
            return false;
        } catch (error) {
            this._logger.error(`Error approving request: ${error.message}`);
            throw new HttpException(
                'Failed to approve request',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async rejectEditorRequest(
        requestId: Types.ObjectId,
        reason: string,
    ): Promise<boolean> {
        try {
            const request = await this._editorRequestRepository.rejectEditorRequest(
                requestId,
                reason,
            );
            return request !== null;
        } catch (error) {
            this._logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException(
                'Failed to reject request',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async countEditorRequests(): Promise<number> {
        return this._editorRequestRepository.countEditorRequests();
    }

    async checkEditorRequest(userId: Types.ObjectId): Promise<boolean> {
        return this._editorRequestRepository.checkEditorRequest(userId);
    }

    async deleteEditorRequest(
        userId: Types.ObjectId,
    ): Promise<EditorRequest | null> {
        return this._editorRequestRepository.deleteRequest(userId);
    }

    async createEditorRequest(userId: Types.ObjectId): Promise<EditorRequest> {
        return this._editorRequestRepository.create(userId);
    }

    async findEditorRequest(
        userId: Types.ObjectId,
    ): Promise<EditorRequest | null> {
        return this._editorRequestRepository.findOne(userId);
    }
}