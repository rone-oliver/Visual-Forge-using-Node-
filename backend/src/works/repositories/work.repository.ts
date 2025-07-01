import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Works, WorksDocument } from "src/works/models/works.schema";
import { IWorkRepository } from "../interfaces/works.repository.interface";
import { CreateWorkDto } from "../dtos/works.dto";

export class WorkRepository implements IWorkRepository {
    constructor(
        @InjectModel(Works.name) private readonly workModel: Model<WorksDocument>,
    ) { }

    async createWork(workData: CreateWorkDto) {
        try {
            return this.workModel.create(workData);
        } catch (error) {
            throw error;
        }
    }

    async getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]> {
        return this.workModel
            .find({ editorId })
            .sort({ createdAt: -1 })
            .limit(2)
            .lean();
    }
}