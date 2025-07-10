import { FilterQuery, PipelineStage, QueryOptions, Types, UpdateQuery } from "mongoose";
import { CompletedWorkDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, getQuotationsByStatusResponseDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto } from "../dtos/quotation.dto";
import { Quotation, QuotationStatus } from "../models/quotation.schema";
import { SuccessResponseDto } from "src/users/dto/users.dto";
export const IQuotationServiceToken = Symbol('IQuotationService');

export interface IQuotationService {
    countAllQuotations(): Promise<number>;
    getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto>;
    getPublishedQuotations(editorId: Types.ObjectId, query: GetPublishedQuotationsQueryDto): Promise<PaginatedPublishedQuotationsResponseDto>;
    getAcceptedQuotations(editorId: Types.ObjectId, query: GetAcceptedQuotationsQueryDto): Promise<PaginatedAcceptedQuotationsResponseDto>;
    findById(quotationId: Types.ObjectId, options?: QueryOptions): Promise<Quotation | null>;
    updateQuotationStatus(quotationId: Types.ObjectId, status: QuotationStatus, worksId: Types.ObjectId, penalty?: number): Promise<Quotation | null>;
    getCompletedQuotations(editorId: Types.ObjectId): Promise<CompletedWorkDto[]>;
    findMany(query: FilterQuery<Quotation>): Promise<Quotation[] | null>;
    updateQuotation(query: FilterQuery<Quotation>, update: UpdateQuery<Quotation>):Promise<Quotation | null>;
    findOneByRazorpayOrderId(orderId:string): Promise<Quotation | null>;
    countQuotationsByFilter(filter: FilterQuery<Quotation>): Promise<number>;
    aggregate(pipeline: PipelineStage[]): Promise<any[]>;
    createQuotation(quotation: Partial<Quotation>): Promise<Quotation>;
    findByIdAndUpdate(quotationId: Types.ObjectId, update: UpdateQuery<Quotation>, options?: QueryOptions): Promise<Quotation | null>;
    deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto>;
    getCompletedQuotationsForUser(userId: Types.ObjectId): Promise<Quotation[] | null>;
    findOne(query: FilterQuery<Quotation>): Promise<Quotation | null>;
}