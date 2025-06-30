import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quotation, QuotationDocument } from "../models/quotation.schema";
import { IQuotationRepository } from "../interfaces/quotation.repository.interface";
import { getQuotationsByStatusResponseDto } from "../dtos/quotation.dto";

@Injectable()
export class QuotationRepository implements IQuotationRepository {
    constructor(
        @InjectModel(Quotation.name) private readonly quotationModel: Model<QuotationDocument>,
    ) { }

    async countDocuments(filter?: any): Promise<number> {
        return this.quotationModel.countDocuments(filter).exec();
    }

    async getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto[]> {
        return this.quotationModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
    }
}