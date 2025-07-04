import { FilterQuery, ProjectionType, Types, UpdateQuery } from "mongoose";
import { User, UserDocument } from "../models/user.schema";
import { IBaseRepository } from "src/common/interfaces/base-repository.interface";

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository extends IBaseRepository<User, UserDocument> {
    // create(user: Partial<User>): Promise<User>;
    // find(filter: FilterQuery<User>): Promise<User[]>;
    // findOne(filter: FilterQuery<User>): Promise<User | null>;
    // findById(id: Types.ObjectId, projection?: ProjectionType<User>): Promise<User | null>;
    // findOneAndUpdate(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    // exists(filter: FilterQuery<User>): Promise<boolean>;
    
    countDocuments(filter?: FilterQuery<User>): Promise<number>;
    getUsersForAdmin(filter: FilterQuery<User>, skip: number, limit: number, projection?: ProjectionType<User>): Promise<User[]>;
}