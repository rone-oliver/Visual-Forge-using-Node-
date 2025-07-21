import {
  FilterQuery,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

import {
  CreateWorkDto,
  GetPublicWorksQueryDto,
  PopulatedWork,
  TopEditorDto,
} from '../dtos/works.dto';
import { Works } from '../models/works.schema';

export const IWorkRepositoryToken = Symbol('IWorkRepository');

export interface IWorkRepository {
  findById(
    id: Types.ObjectId,
    projection?: ProjectionType<Works> | null,
    options?: QueryOptions,
  ): Promise<Works | null>;
  createWork(workData: CreateWorkDto): Promise<Works>;
  getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
  updateOne(
    query: FilterQuery<Works>,
    update: UpdateQuery<Works>,
  ): Promise<Works | null>;
  getPublicWorks(
    filter: GetPublicWorksQueryDto,
  ): Promise<[PopulatedWork[], number]>;
  getTopEditorsByCompletedWorks(limit: number): Promise<TopEditorDto[]>;
}
