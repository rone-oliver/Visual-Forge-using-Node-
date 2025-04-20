import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { EditorsService } from './editors.service';
import { Types } from 'mongoose';

@Controller('editor')
export class EditorsController {
    constructor(
        private editorService: EditorsService,
    ){};

    @Get('quotations/published')
    async getPublishedQuotations(): Promise<IQuotation[]>{
        return this.editorService.getPublishedQuotations();
    }

    @Post('accept-quotation')
    async acceptQuotation(@Body() body:{quotationId: string}, @Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.acceptQuotation(body.quotationId, user.userId);
    }
}
