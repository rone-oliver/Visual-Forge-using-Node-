import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { User } from "../models/user.schema";

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
    find(filter: FilterQuery<User>): Promise<User[]>;
    findById(id: Types.ObjectId): Promise<User | null>;
    findOneAndUpdate(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    countDocuments(): Promise<number>;
}