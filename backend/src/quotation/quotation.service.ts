import { Inject, Injectable } from '@nestjs/common';
import { IQuotationService } from './interfaces/quotation.service.interface';
import { IQuotationRepository, IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { Quotation, QuotationStatus } from './models/quotation.schema';
import { getQuotationsByStatusResponseDto } from './dtos/quotation.dto';

@Injectable()
export class QuotationService implements IQuotationService {
    constructor(
        @Inject(IQuotationRepositoryToken) private readonly quotationRepository: IQuotationRepository,
    ) {}

    async countAllQuotations(): Promise<number> {
        return this.quotationRepository.countDocuments();
    }

    async getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto> {
        const quotationsByStatus = await this.quotationRepository.getQuotationsByStatus();
        const statusCounts = {
            [QuotationStatus.PUBLISHED]: 0,
            [QuotationStatus.ACCEPTED]: 0,
            [QuotationStatus.COMPLETED]: 0,
            [QuotationStatus.EXPIRED]: 0,
            [QuotationStatus.CANCELLED]: 0,
        };
        quotationsByStatus.forEach(status => {
            statusCounts[status._id] = status.count;
        });
        return statusCounts;
    }
}
