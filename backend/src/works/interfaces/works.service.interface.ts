import { Types } from "mongoose";
import { Works } from "../models/works.schema";
import { CreateWorkDto, GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, RateWorkDto, UpdateWorkFilesDto, UpdateWorkPublicStatusDto } from "../dtos/works.dto";
import { SuccessResponseDto } from "src/users/dto/users.dto";

export const IWorkServiceToken = Symbol('IWorkService');

export interface IWorkService {
    createWork(workData: CreateWorkDto): Promise<Works>;
    getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
    rateWork(workId: string, rateWorkDto: RateWorkDto): Promise<SuccessResponseDto>;
    updateWorkPublicStatus(workId: string, updateWorkPublicStatusDto: UpdateWorkPublicStatusDto): Promise<SuccessResponseDto>;
    getPublicWorks(filter: GetPublicWorksQueryDto): Promise<PaginatedPublicWorksResponseDto>;
    updateWorkFiles(workId: string, files: Express.Multer.File[], updateWorkFilesDto: UpdateWorkFilesDto): Promise<SuccessResponseDto>;
}