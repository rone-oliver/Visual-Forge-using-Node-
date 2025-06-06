import { User } from "src/users/models/user.schema";
import { FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto } from "../dto/admins.controller.dto";

export interface IAdminsController {
    getAllUsers(query: GetAllUsersQueryDto): Promise<User[]>;
    getEditorRequests(): Promise<FormattedEditorRequest[]>;
    approveRequest(req: Request, reqId: string): Promise<boolean>;
    rejectRequest(reqId: string, body: { reason: string }): Promise<boolean>;
    getEditors(query: GetEditorsQueryDto): Promise<FormattedEditor[]>;
    blockUser(userId: string): Promise<boolean>;
}