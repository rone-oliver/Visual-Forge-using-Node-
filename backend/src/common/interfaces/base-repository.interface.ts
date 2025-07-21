import {
  Document,
  FilterQuery,
  InsertManyOptions,
  ProjectionType,
  Types,
  UpdateQuery,
} from 'mongoose';

export const IBaseRepositoryToken = Symbol('IBaseRepository');

export interface IBaseRepository<T, D extends Document> {
  insertMany(
    documents: Omit<T, '_id'>[],
    options?: InsertManyOptions,
  ): Promise<void>;
  find(
    filter?: FilterQuery<T>,
    skip?: number,
    limit?: number,
    sort?: any,
  ): Promise<{ items: T[]; totalDocuments: number }>;
  create(newDocument: Partial<T>): Promise<D>;
  findOne(filter: FilterQuery<T>): Promise<D | null>;
  findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
  ): Promise<D | null>;
  findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<D | null>;
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<any>;
  findByIdAndDelete(id: string | Types.ObjectId): Promise<D | null>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}
