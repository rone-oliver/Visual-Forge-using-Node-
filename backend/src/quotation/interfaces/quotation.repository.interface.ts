import { Types, UpdateQuery } from "mongoose";
import { GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, getQuotationsByStatusResponseDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto } from "../dtos/quotation.dto";
import { Quotation } from "../models/quotation.schema";

export const IQuotationRepositoryToken = Symbol('IQuotationRepository');

export interface IQuotationRepository {
    countDocuments(filter?: any): Promise<number>;
    getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto[]>;
    getAcceptedQuotations(editorId: Types.ObjectId, query: GetAcceptedQuotationsQueryDto);
    getPublishedQuotations(editorId: Types.ObjectId, query: GetPublishedQuotationsQueryDto);
    findById(quotationId: Types.ObjectId): Promise<Quotation | null>;
    findByIdAndUpdate(quotationId: Types.ObjectId, update: UpdateQuery<Quotation>): Promise<Quotation | null>;
    getCompletedQuotations(editorId: Types.ObjectId): Promise<Quotation[]>;
}