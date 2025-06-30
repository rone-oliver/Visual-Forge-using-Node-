import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { User, UserDocument } from "../models/user.schema";
import { IUserRepository } from "../interfaces/users.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { };

    async find(filter: FilterQuery<User>): Promise<User[]> {
        return this.userModel.find(filter).exec();
    }

    async findById(id: Types.ObjectId): Promise<User | null> {
        return this.userModel.findById(id).exec();
    }

    async findOneAndUpdate(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null> {
        return this.userModel.findOneAndUpdate(filter, update, { new: true }).exec();
    }

    async countDocuments(): Promise<number> {
        return this.userModel.countDocuments().exec();
    }
}