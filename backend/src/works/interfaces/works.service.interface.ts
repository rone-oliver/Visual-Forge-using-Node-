import { Types } from "mongoose";
import { Works } from "../models/works.schema";
import { CreateWorkDto } from "../dtos/works.dto";

export const IWorkServiceToken = Symbol('IWorkService');

export interface IWorkService {
    createWork(workData: CreateWorkDto): Promise<Works>;
    getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
}