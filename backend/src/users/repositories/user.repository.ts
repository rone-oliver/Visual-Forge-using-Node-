import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, ProjectionType, Types, UpdateQuery } from "mongoose";
import { User, UserDocument } from "../models/user.schema";
import { IUserRepository } from "../interfaces/users.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { };

    async create(user: Partial<User>): Promise<User> {
        return this.userModel.create(user);
    }

    async find(filter: FilterQuery<User>): Promise<User[]> {
        return this.userModel.find(filter).exec();
    }

    async findOne(filter: FilterQuery<User>): Promise<User | null> {
        return this.userModel.findOne(filter).exec();
    }

    async findById(id: Types.ObjectId, projection?: ProjectionType<User>): Promise<User | null> {
        return this.userModel.findById(id, projection).exec();
    }

    async findOneAndUpdate(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null> {
        return this.userModel.findOneAndUpdate(filter, update, { new: true }).exec();
    }

    async exists(filter: FilterQuery<User>): Promise<boolean> {
        const result = await this.userModel.exists(filter).exec();
        return !!result;
    }

    async countDocuments(filter?: FilterQuery<User>): Promise<number> {
        return this.userModel.countDocuments(filter).exec();
    }

    async getUsersForAdmin(filter: FilterQuery<User>, skip: number, limit: number, projection?: ProjectionType<User>): Promise<User[]> {
        return this.userModel.find(filter, projection).skip(skip).limit(limit).exec();
    }
}