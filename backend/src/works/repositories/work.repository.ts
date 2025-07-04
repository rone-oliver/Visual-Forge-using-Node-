import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { Works, WorksDocument } from "src/works/models/works.schema";
import { IWorkRepository } from "../interfaces/works.repository.interface";
import { CreateWorkDto, GetPublicWorksQueryDto, PopulatedWork } from "../dtos/works.dto";
import { User, UserDocument } from "src/users/models/user.schema";
import { Editor, EditorDocument } from "src/editors/models/editor.schema";
import { Logger } from "@nestjs/common";

export class WorkRepository implements IWorkRepository {
    private readonly logger = new Logger(WorkRepository.name);
    
    constructor(
        @InjectModel(Works.name) private readonly workModel: Model<WorksDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Editor.name) private readonly editorModel: Model<EditorDocument>,
    ) { }

    async updateOne(query: FilterQuery<Works>, update: UpdateQuery<Works>): Promise<Works | null> {
        try {
            return this.workModel.findOneAndUpdate(query, update, { new: true }).lean();
        } catch (error) {
            throw error;
        }
    }

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

    async getPublicWorks(params: GetPublicWorksQueryDto): Promise<[PopulatedWork[], number]> {
        const filter: any = { isPublic: true };

        if (params.rating !== undefined && params.rating !== null) {
            filter.rating = params.rating;
        }

        if (params.search && params.search.trim()) {
            const searchTerm = params.search.trim().toLowerCase();

            const [matchingUsers, matchingEditors] = await Promise.all([
                this.userModel.find({ fullname: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
                this.userModel.find({ fullname: { $regex: searchTerm, $options: 'i' }, isEditor: true }).select('_id').lean()
            ]);

            const userIds = matchingUsers.map(user => user._id.toString());
            const editorIds = matchingEditors.map(editor => new Types.ObjectId(editor._id));

            if (userIds.length > 0 || editorIds.length > 0) {
                filter.$or = [];
                if (userIds.length > 0) {
                    filter.$or.push({ userId: { $in: userIds } });
                }
                if (editorIds.length > 0) {
                    filter.$or.push({ editorId: { $in: editorIds } });
                }
            } else {
                return [[], 0];
            }
        }

        const [works, total]: [PopulatedWork[], number] = await Promise.all([
            this.workModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((params.page - 1) * params.limit)
                .limit(params.limit)
                .populate<{
                    editorId: { _id: Types.ObjectId; fullname: string; username: string; email: string; profileImage?: string } | null; 
                    userId: { _id: Types.ObjectId; fullname: string; username: string; email: string; profileImage?: string } | null;
                }>([
                    { path: 'editorId', select: 'fullname username profileImage email _id', model: this.userModel },
                    { path: 'userId', select: 'fullname username profileImage email _id', model: this.userModel }
                ])
                .lean(),
            this.workModel.countDocuments(filter)
        ]);

        return [works, total];
    }
}