import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Editor, EditorDocument } from './models/editor.schema';
import { Model, Types } from 'mongoose';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { Quotation, QuotationDocument, QuotationStatus } from 'src/common/models/quotation.schema';

@Injectable()
export class EditorsService {
    private readonly logger = new Logger(EditorsService.name);
    constructor(
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
    ) { };

    async createEditor(editor: Partial<Editor>): Promise<Editor> {
        return this.editorModel.create(editor);
    }

    async getPublishedQuotations(): Promise<IQuotation[]> {
        try {
            return await this.quotationModel.find({ status: QuotationStatus.PUBLISHED })
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
}
