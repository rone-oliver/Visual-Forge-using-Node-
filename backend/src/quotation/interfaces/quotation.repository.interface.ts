import { getQuotationsByStatusResponseDto } from "../dtos/quotation.dto";

export const IQuotationRepositoryToken = Symbol('IQuotationRepository');

export interface IQuotationRepository {
    countDocuments(filter?: any): Promise<number>;
    getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto[]>;
}
