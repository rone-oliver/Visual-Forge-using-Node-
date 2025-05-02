import { Body, Controller, Get, Logger, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { EditorsService } from './editors.service';
import { Types } from 'mongoose';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Editor } from './models/editor.schema';
import { User } from 'src/users/models/user.schema';

@Controller('editor')
@UseGuards(AuthGuard,RolesGuard)
export class EditorsController {
    private readonly logger = new Logger(EditorsController.name);
    constructor(
        private editorService: EditorsService,
    ){};

    @Get('quotations/published')
    @Roles('Editor')
    async getPublishedQuotations(@Req() req: Request): Promise<IQuotation[]>{
        const editor = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.getPublishedQuotations(editor.userId);
    }
    
    @Post('accept-quotation')
    @Roles('Editor')
    async acceptQuotation(@Body() body:{quotationId: string}, @Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.acceptQuotation(body.quotationId, user.userId);
    }

    @Get('quotations/accepted')
    @Roles('Editor')
    async getAcceptedQuotations(@Req() req: Request): Promise<IQuotation[]>{
        const editor = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.getAcceptedQuotations(editor.userId);
    }

    @Post('works/files-upload')
    @Roles('Editor')
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
    @Roles('Editor')
    async submitQuotationResponse(@Body() workData: any): Promise<boolean> {
        return this.editorService.submitQuotationResponse(workData);
    }

    @Get('works/completed')
    @Roles('Editor')
    async getCompletedWorks(@Req() req: Request): Promise<any[]> {
        const editor = req['user'] as { userId: Types.ObjectId, role: string};
        return this.editorService.getCompletedWorks(editor.userId);
    }

    @Get(':id')
    async getEditor(@Param('id') id: string): Promise<User & { editorDetails?: any } | null> {
        return this.editorService.getEditor(id);
    }
}
