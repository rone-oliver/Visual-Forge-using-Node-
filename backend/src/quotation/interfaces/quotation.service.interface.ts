import { getQuotationsByStatusResponseDto } from "../dtos/quotation.dto";
export const IQuotationServiceToken = Symbol('IQuotationService');

export interface IQuotationService {
    countAllQuotations(): Promise<number>;
    getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto>;
}