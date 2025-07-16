import { FilterQuery, ProjectionType, QueryOptions, Types, UpdateQuery } from "mongoose";
import { Works } from "../models/works.schema";
import { CreateWorkDto, GetPublicWorksQueryDto, PopulatedWork } from "../dtos/works.dto";

export const IWorkRepositoryToken = Symbol('IWorkRepository');

export interface IWorkRepository {
    findById(id: Types.ObjectId, projection?: ProjectionType<Works> | null, options?: QueryOptions): Promise<Works | null>;
    createWork(workData: CreateWorkDto): Promise<Works>;
    getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
    updateOne(query: FilterQuery<Works>, update: UpdateQuery<Works>): Promise<Works | null>;
    getPublicWorks(filter: GetPublicWorksQueryDto): Promise<[PopulatedWork[], number]>;
}