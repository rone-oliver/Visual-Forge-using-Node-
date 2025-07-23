import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  IRelationshipService,
  IRelationshipServiceToken,
} from 'src/common/relationship/interfaces/service.interface';
import { getYouTubeEmbedUrl } from 'src/common/utils/youtube-url.util';
import {
  IEditorsService,
  IEditorsServiceToken,
} from 'src/editors/interfaces/services/editors.service.interface';

import {
  EditorPublicProfileResponseDto,
  EditorRequestStatusResponseDto,
  GetPublicEditorsDto,
  PaginatedPublicEditorsDto,
  RateEditorDto,
  SuccessResponseDto,
  UserRatingForEditorDto,
} from '../dto/users.dto';
import { IUserEditorService } from '../interfaces/services/user-editor.service.interface';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../interfaces/users.repository.interface';
import { User } from '../models/user.schema';

@Injectable()
export class UserEditorService implements IUserEditorService {
  private readonly _logger = new Logger(UserEditorService.name);

  constructor(
    @Inject(IEditorsServiceToken)
    private readonly _editorService: IEditorsService,
    @Inject(IUserRepositoryToken)
    private readonly _userRepository: IUserRepository,
    @Inject(forwardRef(() => IRelationshipServiceToken))
    private readonly _relationshipService: IRelationshipService,
  ) {}

  async requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto> {
    try {
      const user = await this._userRepository.findById(userId, { isEditor: 1 });
      if (user && !user.isEditor) {
        this._logger.log(
          `User ${userId} is not an editor. Proceeding with request.`,
        );
        if (await this._editorService.checkEditorRequest(userId)) {
          this._logger.log(`User ${userId} already has an editor request`);
          await this._editorService.deleteEditorRequest(userId);
        }
        await this._editorService.createEditorRequest(userId);
        this._logger.log(`Editor request created for user ${userId}`);
        return { success: true };
      }
      this._logger.log(`User ${userId} is already an editor or not found`);
      return { success: false };
    } catch (error) {
      this._logger.error(`Error requesting editor role: ${error.message}`);
      return { success: false };
    }
  }

  async getEditorRequestStatus(
    userId: Types.ObjectId,
  ): Promise<EditorRequestStatusResponseDto> {
    try {
      const request = await this._editorService.findEditorRequest(userId);
      if (request) {
        this._logger.log(
          `Editor request status for user ${userId}: ${request.status}`,
        );
        return { status: request.status };
      }
      return { status: null };
    } catch (error) {
      this._logger.error(
        `Error fetching editor request status: ${error.message}`,
      );
      throw error;
    }
  }

  async rateEditor(
    userId: Types.ObjectId,
    rateEditorDto: RateEditorDto,
  ): Promise<SuccessResponseDto> {
    try {
      const editorObjectId = new Types.ObjectId(rateEditorDto.editorId);

      await this._editorService.updateEditor(editorObjectId, {
        $pull: { ratings: { userId: userId } },
      });

      const result = await this._editorService.updateEditor(editorObjectId, {
        $push: {
          ratings: {
            rating: rateEditorDto.rating,
            feedback: rateEditorDto.feedback,
            userId,
          },
        },
      });

      if (result) {
        this._logger.log('rating editor success');
        return { success: true };
      } else {
        this._logger.error(
          'rating editor failed: Editor not found or not updated',
        );
        throw new NotFoundException(
          'Editor not found or rating could not be updated.',
        );
      }
    } catch (error) {
      this._logger.error('rating editor failed', error);
      throw new InternalServerErrorException('Failed to rate editor');
    }
  }

  async getPublicEditors(
    params: GetPublicEditorsDto,
  ): Promise<PaginatedPublicEditorsDto> {
    let { search, category, rating, page = 1, limit = 10 } = params;
    limit = parseInt(limit.toString());
    page = parseInt(page.toString());
    rating = rating ? parseInt(rating.toString()) : undefined;

    const skip = (page - 1) * limit;

    const matchStage: any = { 'user.isVerified': true };

    if (search) {
      matchStage['$or'] = [
        { 'user.fullname': { $regex: search, $options: 'i' } },
        { 'user.username': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      matchStage.category = { $regex: category, $options: 'i' };
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: matchStage },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: '$ratings.rating' }, 0] },
        },
      },
    ];

    if (rating) {
      pipeline.push({ $match: { averageRating: { $gte: rating } } });
    }

    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: '$user._id',
              fullname: '$user.fullname',
              username: '$user.username',
              profileImage: '$user.profileImage',
              category: '$category',
              score: '$score',
              averageRating: '$averageRating',
              isVerified: '$user.isVerified',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    });

    const result = await this._editorService.getPublicEditors(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.total.length > 0 ? result[0].total[0].count : 0;

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getPublicEditorProfile(
    editorId: string,
    currentUserId?: string,
  ): Promise<EditorPublicProfileResponseDto> {
    if (!Types.ObjectId.isValid(editorId)) {
      this._logger.log(`Invalid editor ID format: ${editorId}`);
      throw new BadRequestException('Invalid editor ID format.');
    }

    const editorObjectId = new Types.ObjectId(editorId);

    const editor =
      await this._editorService.getEditorUserCombined(editorObjectId);

    if (!editor || !editor.userId) {
      this._logger.log(`Editor with user ID ${editorId} not found.`);
      throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
    }

    const user = editor.userId as unknown as User;

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this._relationshipService
        .getFollowers({ userId: editorObjectId, limit: 0, skip: 0 })
        .then((f) => f.length),
      this._relationshipService
        .getFollowing({ userId: editorObjectId, limit: 0, skip: 0 })
        .then((f) => f.length),
      currentUserId && Types.ObjectId.isValid(currentUserId)
        ? this._relationshipService.isFollowing(
            new Types.ObjectId(currentUserId),
            editorObjectId,
          )
        : Promise.resolve(false),
    ]);

    const averageRating = this._calculateAverageRating(editor.ratings);

    const sharedTutorials = (editor.sharedTutorials || [])
      .map(getYouTubeEmbedUrl)
      .filter((url) => url !== '');

    return {
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      profileImage: user.profileImage || '',
      score: editor.score || 0,
      averageRating,
      categories: editor.category || [],
      about: user.about || '',
      sharedTutorials,
      tipsAndTricks: editor.tipsAndTricks || '',
      socialLinks: editor.socialLinks || {},
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  async getCurrentEditorRating(
    userId: Types.ObjectId,
    editorId: string,
  ): Promise<UserRatingForEditorDto | null> {
    try {
      const editor = await this._editorService.getEditorRating(
        new Types.ObjectId(editorId),
      );
      if (editor?.ratings && editor.ratings.length > 0) {
        this._logger.log(
          `Editor ratings for user ${editorId}: ${editor.ratings}`,
        );
        const specificRating = editor.ratings.find((rating) =>
          rating.userId.equals(userId),
        );
        if (specificRating) {
          this._logger.log(
            `Current rating of user ${userId} on editor ${editorId}: ${specificRating.rating}`,
          );
          return {
            rating: specificRating.rating,
            feedback: specificRating.feedback,
            userId: specificRating.userId.toString(), // Convert ObjectId to string
          };
        }
        this._logger.log(
          `No specific rating found for user ${userId} on editor ${editorId}`,
        );
        return null;
      }
      this._logger.log(`No ratings found for editor ${editorId}`);
      return null;
    } catch (error) {
      this._logger.error(
        `Error getting current editor rating: ${error.message}`,
      );
      throw error;
    }
  }

  private _calculateAverageRating(ratings: any[] | undefined): number {
    if (!ratings || ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }
}
