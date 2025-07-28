import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { User, UserDocument } from 'src/users/models/user.schema';
import { Works, WorksDocument } from 'src/works/models/works.schema';

import {
  CreateWorkDto,
  GetPublicWorksQueryDto,
  PopulatedWork,
  TopEditorDto,
} from '../dtos/works.dto';
import { IWorkRepository } from '../interfaces/works.repository.interface';

@Injectable()
export class WorkRepository implements IWorkRepository {
  private readonly _logger = new Logger(WorkRepository.name);

  constructor(
    @InjectModel(Works.name) private readonly _workModel: Model<WorksDocument>,
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
  ) {}

  async findById(
    id: Types.ObjectId,
    projection?: ProjectionType<Works> | null,
    options?: QueryOptions,
  ): Promise<Works | null> {
    return this._workModel.findById(id, projection, options).lean();
  }

  async updateOne(
    query: FilterQuery<Works>,
    update: UpdateQuery<Works>,
  ): Promise<Works | null> {
    return this._workModel
      .findOneAndUpdate(query, update, { new: true })
      .lean();
  }

  async createWork(workData: CreateWorkDto) {
    return this._workModel.create(workData);
  }

  async getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]> {
    return this._workModel
      .find({ editorId })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();
  }

  async getPublicWorks(
    params: GetPublicWorksQueryDto,
  ): Promise<[PopulatedWork[], number]> {
    const filter: FilterQuery<WorksDocument> = { isPublic: true };

    if (params.rating !== undefined && params.rating !== null) {
      filter.rating = params.rating;
    }

    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();

      const [matchingUsers, matchingEditors] = await Promise.all([
        this._userModel
          .find({ fullname: { $regex: searchTerm, $options: 'i' } })
          .select('_id')
          .lean(),
        this._userModel
          .find({
            fullname: { $regex: searchTerm, $options: 'i' },
            isEditor: true,
          })
          .select('_id')
          .lean(),
      ]);

      const userIds = matchingUsers.map((user) => new Types.ObjectId(user._id));
      const editorIds = matchingEditors.map(
        (editor) => new Types.ObjectId(editor._id),
      );

      if (userIds.length > 0 || editorIds.length > 0) {
        filter.$or = [];
        if (userIds.length > 0) {
          filter.$or.push({ userId: { $in: userIds } });
        }
        if (editorIds.length > 0) {
          filter.$or.push({ editorId: { $in: editorIds } });
        }
      } else {
        return [[], 0];
      }
    }

    const [works, total]: [PopulatedWork[], number] = await Promise.all([
      this._workModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit)
        .populate<{
          editorId: {
            _id: Types.ObjectId;
            fullname: string;
            username: string;
            email: string;
            profileImage?: string;
          } | null;
          userId: {
            _id: Types.ObjectId;
            fullname: string;
            username: string;
            email: string;
            profileImage?: string;
          } | null;
        }>([
          {
            path: 'editorId',
            select: 'fullname username profileImage email _id',
            model: this._userModel,
          },
          {
            path: 'userId',
            select: 'fullname username profileImage email _id',
            model: this._userModel,
          },
        ])
        .lean(),
      this._workModel.countDocuments(filter),
    ]);

    return [works, total];
  }

  async getTopEditorsByCompletedWorks(limit: number): Promise<TopEditorDto[]> {
    return this._workModel.aggregate([
      {
        $group: {
          _id: '$editorId',
          completedWorksCount: { $sum: 1 },
        },
      },
      { $sort: { completedWorksCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'editor',
        },
      },
      {
        $unwind: '$editor',
      },
      {
        $project: {
          _id: '$editor._id',
          fullname: '$editor.fullname',
          email: '$editor.email',
          completedWorksCount: '$completedWorksCount',
        },
      },
    ]);
  }

  async getAverageEditorRating(
    editorId: Types.ObjectId
  ): Promise<{ averageRating: number; count: number; } | null> {
    const result = await this._workModel.aggregate([
      {
        $match: {
          editorId: new Types.ObjectId(editorId),
          editorRating: { $exists: true, $ne: null, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$editorRating' },
          count: { $count: {} },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ['$averageRating', 1] },
          count: 1,
        },
      },
    ]);

    if(result.length > 0){
      return result[0];
    }
    return { averageRating: 0, count: 0 };
  }
}
