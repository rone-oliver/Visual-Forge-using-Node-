import { FilterQuery, ProjectionType, Types, UpdateQuery } from "mongoose";
import { User } from "../models/user.schema";

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
    create(user: Partial<User>): Promise<User>;
    find(filter: FilterQuery<User>): Promise<User[]>;
    findOne(filter: FilterQuery<User>): Promise<User | null>;
    findById(id: Types.ObjectId, projection?: ProjectionType<User>): Promise<User | null>;
    findOneAndUpdate(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    countDocuments(): Promise<number>;
}