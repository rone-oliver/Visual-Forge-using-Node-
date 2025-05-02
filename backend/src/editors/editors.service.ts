import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Editor, EditorDocument } from './models/editor.schema';
import { Model, Types } from 'mongoose';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { Quotation, QuotationDocument, QuotationStatus } from 'src/common/models/quotation.schema';
import { Observable } from 'rxjs';
import { CloudinaryService, FileUploadResult } from 'src/common/cloudinary/cloudinary.service';
import { Works, WorksDocument } from 'src/common/models/works.schema';
import { CompletedWork } from 'src/common/interfaces/completed-word.interface';
import { User, UserDocument } from 'src/users/models/user.schema';

@Injectable()
export class EditorsService {
    private readonly logger = new Logger(EditorsService.name);
    constructor(
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
        @InjectModel(Works.name) private workModel: Model<WorksDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private cloudinaryService: CloudinaryService,
    ) { };

    async createEditor(editor: Partial<Editor>): Promise<Editor> {
        return this.editorModel.create(editor);
    }

    async getPublishedQuotations(userId:Types.ObjectId): Promise<IQuotation[]> {
        try {
            return await this.quotationModel.find({ status: QuotationStatus.PUBLISHED, userId:{$ne:userId}}).sort({ createdAt: -1}).lean() as unknown as IQuotation[];
        } catch (error) {
            this.logger.error('Error getting the published quotations', error);
            throw new Error('Error getting the published quotations');
        }
    }

    async acceptQuotation(quotationId: string, editorId: Types.ObjectId): Promise<boolean> {
        try {
            const quotation = await this.quotationModel.findByIdAndUpdate(new Types.ObjectId(quotationId), { status: QuotationStatus.ACCEPTED, editorId },
                { new: true, runValidators: true }
            );
            if (!quotation) {
                this.logger.warn(`Quotation with ID ${quotationId} not found`);
                return false;
            }

            this.logger.log(`Quotation ${quotationId} accepted by editor ${editorId}`);
            return true;
        } catch (error) {
            this.logger.error('Error accepting the quotation ', error);
            throw new Error('Error accepting the quotation');
        }
    }

    async getAcceptedQuotations(editorId: Types.ObjectId): Promise<IQuotation[]> {
        try {
            return await this.quotationModel.find({ editorId, status: QuotationStatus.ACCEPTED })
            .sort({ status: 1, createdAt: 1})
            .lean() as unknown as IQuotation[];
        } catch (error) {
            this.logger.error('Error getting the accepted quotations', error);
            throw new Error('Error getting the accepted quotations');
        }
    }

    async uploadWorkFiles(files: Express.Multer.File[],folder?:string):Promise<FileUploadResult[]>{
        try {
            const uploadPromises = await this.cloudinaryService.uploadFiles(files, folder);
            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error(`Error in uploadFiles: ${error.message}`);
            throw error;
        }
    }

    async submitQuotationResponse(workData: any){
        try {
            const { userId, quotationId, finalFiles, comments } = workData;
            const quotation = await this.quotationModel.findById(new Types.ObjectId(quotationId));
            if (!quotation) {
                this.logger.warn(`Quotation with ID ${quotationId} not found`);
                return false;
            }
            const work = await this.workModel.create({
                editorId: quotation.editorId,
                userId: quotation.userId,
                finalFiles,
                comments,
            });
            await this.quotationModel.findByIdAndUpdate(quotation._id,{status:QuotationStatus.COMPLETED,worksId:work._id})
            return true;
        } catch (error) {
            this.logger.error('Error submitting the quotation response', error);
            throw new Error('Error submitting the quotation response');
        }
    }

    async getCompletedWorks(editorId: Types.ObjectId):Promise<CompletedWork[]>{
        try {
            const completedQuotations = await this.quotationModel
            .find({ editorId, status: QuotationStatus.COMPLETED})
            .populate('worksId')
            .sort({ createdAt: -1})
            .lean();

            return completedQuotations.map(quotation => {
                const worksData = quotation.worksId as any || {};
                const { worksId,...quotationData } = quotation;
                return {
                    ...quotationData,
                    ...worksData,
                    quotationId: quotation._id,
                    worksId: worksData._id || null,
                    finalFiles: worksData.finalFiles || [],
                    attachedFiles: quotationData.attachedFiles || [],
                    comments: worksData.comments || '',
                    completedAt: worksData.createdAt,
                } as CompletedWork;
            })
        } catch (error) {
            this.logger.error('Error getting the completed works', error);
            throw new Error('Error getting the completed works');
        }
    }

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async getEditor(editorId: string):Promise<User & { editorDetails?: any } | null>{
        try {
            const user = await this.userModel.findById(new Types.ObjectId(editorId));
            if (user && user.isEditor) {
                this.logger.log('Fetching the editor details');
                console.log('user id: ', user._id);
                const editorDetails = await this.editorModel.findOne({ userId: user._id }).lean();
                if (editorDetails) {
                    this.logger.log('Editor details: ', editorDetails)
                    const userObj = user.toObject();
                    return {
                        ...userObj,
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this.calculateAverageRating(editorDetails.ratings),
                            socialLinks: editorDetails.socialLinks || {},
                            createdAt: editorDetails.createdAt,
                        }
                    }
                } else console.log('no editor details');
            }
            return null;
        } catch (error) {
            this.logger.error('Error getting the editor', error);
            throw new Error('Error getting the editor');
        }
    }
}
