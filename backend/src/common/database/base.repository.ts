import {
  Document,
  FilterQuery,
  InsertManyOptions,
  Model,
  ProjectionType,
  Types,
  UpdateQuery,
} from 'mongoose';

import { IBaseRepository } from '../interfaces/base-repository.interface';

export class BaseRepository<T, D extends Document>
  implements IBaseRepository<T, D>
{
  constructor(protected model: Model<D>) {}

  async insertMany(
    documents: Omit<T, '_id'>[],
    options?: InsertManyOptions,
  ): Promise<void> {
    if (options) await this.model.insertMany(documents, options);
    else await this.model.insertMany(documents);
  }

  async find(filter: FilterQuery<T> = {}, skip = 0, limit = 10, sort: any) {
    const [items, totalDocuments] = await Promise.all([
      this.model
        .find(filter)
        .skip(skip)
        .sort(sort)
        .limit(limit)
        .lean() as Promise<T[]>,
      this.model.countDocuments(filter),
    ]);

    return { items, totalDocuments };
  }

  async create(newDocument: Partial<T>): Promise<D> {
    return this.model.create(newDocument);
  }

  async findOne(filter: FilterQuery<T>): Promise<D | null> {
    return this.model.findOne(filter).exec();
  }

  async findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
  ): Promise<D | null> {
    return this.model.findById(id, projection).exec();
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<D>,
  ): Promise<D | null> {
    return this.model
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<D>,
  ): Promise<any> {
    return this.model.updateMany(filter, update);
  }

  async findByIdAndDelete(id: string | Types.ObjectId): Promise<D | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter).exec();
    return !!result;
  }
}
