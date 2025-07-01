import { Inject, Injectable } from '@nestjs/common';
import { IWorkService } from './interfaces/works.service.interface';
import { IWorkRepository, IWorkRepositoryToken } from './interfaces/works.repository.interface';
import { Logger } from '@nestjs/common';
import { Works } from './models/works.schema';
import { Types } from 'mongoose';
import { CreateWorkDto } from './dtos/works.dto';

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
}
