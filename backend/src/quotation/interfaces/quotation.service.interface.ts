import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { CompletedWorkDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, getQuotationsByStatusResponseDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto } from "../dtos/quotation.dto";
import { Quotation, QuotationStatus } from "../models/quotation.schema";
export const IQuotationServiceToken = Symbol('IQuotationService');

export interface IQuotationService {
    countAllQuotations(): Promise<number>;
    getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto>;
    getPublishedQuotations(editorId: Types.ObjectId, query: GetPublishedQuotationsQueryDto): Promise<PaginatedPublishedQuotationsResponseDto>;
    getAcceptedQuotations(editorId: Types.ObjectId, query: GetAcceptedQuotationsQueryDto): Promise<PaginatedAcceptedQuotationsResponseDto>;
    findById(quotationId: Types.ObjectId): Promise<Quotation | null>;
    updateQuotationStatus(quotationId: Types.ObjectId, status: QuotationStatus, worksId: Types.ObjectId): Promise<Quotation | null>;
    getCompletedQuotations(editorId: Types.ObjectId): Promise<CompletedWorkDto[]>;
    findMany(query: FilterQuery<Quotation>): Promise<Quotation[] | null>;
    updateQuotation(query: FilterQuery<Quotation>, update: UpdateQuery<Quotation>):Promise<Quotation | null>;
    findOneByRazorpayOrderId(orderId:string): Promise<Quotation | null>;
}