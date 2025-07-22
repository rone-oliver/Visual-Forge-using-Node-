import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FilterQuery,
  Model,
  ProjectionType,
} from 'mongoose';
import { BaseRepository } from 'src/common/database/base.repository';

import { IUserRepository } from '../interfaces/users.repository.interface';
import { User, UserDocument } from '../models/user.schema';

@Injectable()
export class UserRepository
  extends BaseRepository<User, UserDocument>
  implements IUserRepository
{
  constructor(
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
  ) {
    super(_userModel);
  }

  async exists(filter: FilterQuery<User>): Promise<boolean> {
    const result = await this._userModel.exists(filter).exec();
    return !!result;
  }

  async countDocuments(filter?: FilterQuery<User>): Promise<number> {
    return this._userModel.countDocuments(filter).exec();
  }

  async getUsersForAdmin(
    filter: FilterQuery<User>,
    skip: number,
    limit: number,
    projection?: ProjectionType<User>,
  ): Promise<User[]> {
    return this._userModel
      .find(filter, projection)
      .skip(skip)
      .limit(limit)
      .exec();
  }
}
