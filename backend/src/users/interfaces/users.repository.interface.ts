import { FilterQuery, ProjectionType, Types, UpdateQuery } from 'mongoose';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

import { User, UserDocument } from '../models/user.schema';

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository extends IBaseRepository<User, UserDocument> {
  countDocuments(filter?: FilterQuery<User>): Promise<number>;
  getUsersForAdmin(
    filter: FilterQuery<User>,
    skip: number,
    limit: number,
    projection?: ProjectionType<User>,
  ): Promise<User[]>;
}
