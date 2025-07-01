import { Types } from "mongoose";
import { Works } from "../models/works.schema";
import { CreateWorkDto } from "../dtos/works.dto";

export const IWorkRepositoryToken = Symbol('IWorkRepository');

export interface IWorkRepository {
    createWork(workData: CreateWorkDto): Promise<Works>;
    getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
}