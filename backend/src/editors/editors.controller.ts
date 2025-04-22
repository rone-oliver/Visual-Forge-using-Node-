import { Body, Controller, Get, Logger, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { EditorsService } from './editors.service';
import { Types } from 'mongoose';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('editor')
export class EditorsController {
    private readonly logger = new Logger(EditorsController.name);
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

    @Get('quotations/accepted')
    async getAcceptedQuotations(@Req() req: Request): Promise<IQuotation[]>{
        const editor = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.getAcceptedQuotations(editor.userId);
    }

    @Post('works/files-upload')
    @UseInterceptors(FilesInterceptor('files',3))
    async uploadWorkFiles(
        @Req() req: Request,
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?:string,
    ) {
        this.logger.log(`Uploading ${files.length} files`);
        return this.editorService.uploadWorkFiles(files,folder);
    }

    @Post('quotation/submit-response')
    async submitQuotationResponse(@Body() workData: any): Promise<boolean> {
        return this.editorService.submitQuotationResponse(workData);
    }

    @Get('works/completed')
    async getCompletedWorks(@Req() req: Request): Promise<any[]> {
        const editor = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.getCompletedWorks(editor.userId);
    }
}
