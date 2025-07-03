import { Inject, Injectable } from '@nestjs/common';
import { IWorkService } from './interfaces/works.service.interface';
import { IWorkRepository, IWorkRepositoryToken } from './interfaces/works.repository.interface';
import { Logger } from '@nestjs/common';
import { Works } from './models/works.schema';
import { Types } from 'mongoose';
import { CreateWorkDto, GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, PublicWorkItemDto, RateWorkDto, UpdateWorkPublicStatusDto } from './dtos/works.dto';
import { FileUploadResultDto, SuccessResponseDto } from 'src/users/dto/users.dto';

@Injectable()
export class WorksService implements IWorkService {
    private readonly logger = new Logger(WorksService.name);
    
    constructor(
        @Inject(IWorkRepositoryToken) private readonly workRepository: IWorkRepository,
    ) { }

    async createWork(workData: CreateWorkDto) {
        try {
            return this.workRepository.createWork(workData);
        } catch (error) {
            this.logger.log('Failed to create work', error);
            throw error;
        }
    }

    async getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]> {
        try {
            return this.workRepository.getTwoRecentWorks(editorId);
        } catch (error) {
            this.logger.log('Failed to get two recent works', error);
            throw error;
        }
    }

    async rateWork(workId: string, rateWorkDto: RateWorkDto): Promise<SuccessResponseDto> {
        try {
            this.logger.log('rating work:', workId, rateWorkDto.rating, rateWorkDto.feedback);
            await this.workRepository.updateOne({ _id: new Types.ObjectId(workId) }, { $set: { rating: rateWorkDto.rating, feedback: rateWorkDto.feedback } });
            this.logger.log('rating work success');
            return { success: true, message: 'Work rated successfully' };
        } catch (error) {
            this.logger.error('Failed to rate work', error);
            throw error;
        }
    }

    async updateWorkPublicStatus(workId: string, updateWorkPublicStatusDto: UpdateWorkPublicStatusDto): Promise<SuccessResponseDto> {
        try {
            await this.workRepository.updateOne({ _id: new Types.ObjectId(workId) }, { $set: { isPublic: updateWorkPublicStatusDto.isPublic } });
            this.logger.log('Work Public status updated');
            return { success: true, message: 'Work Public status updated'}
        } catch (error) {
            this.logger.error('Failed to update work public status');
            throw error;
        }
    }

    async getPublicWorks(params: GetPublicWorksQueryDto): Promise<PaginatedPublicWorksResponseDto> {
        try {
            const [works, total] = await this.workRepository.getPublicWorks(params);

            const publicWorksDto: PublicWorkItemDto[] = works.map(work => {
                const editorInfo = work.editorId as any;
                const userInfo = work.userId as any;

                return {
                    _id: work._id.toString(),
                    comments: work.comments,
                    isPublic: !!work.isPublic,
                    finalFiles: work.finalFiles as unknown as FileUploadResultDto[] || [],
                    rating: work.rating,
                    feedback: work.feedback,
                    createdAt: work.createdAt,
                    updatedAt: work.updatedAt,
                    editor: {
                        _id: editorInfo._id.toString(),
                        fullname: editorInfo.fullname,
                        username: editorInfo.username,
                        email: editorInfo.email,
                        profileImage: editorInfo.profileImage,
                    },
                    user: {
                        _id: userInfo._id.toString(),
                        fullname: userInfo.fullname,
                        username: userInfo.username,
                        email: userInfo.email,
                        profileImage: userInfo.profileImage,
                    },
                };
            });

            return { works: publicWorksDto, total };
        } catch (error) {
            this.logger.error('Failed to get public works', error);
            throw error;
        }
    }
}
