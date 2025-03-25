import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './models/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async createUser(user: Partial<User>): Promise<User> {
        return this.userModel.create(user);
    }

    async findOne(filter: Partial<User>): Promise<User | null> {
        return this.userModel.findOne(filter).exec();
    }
}
