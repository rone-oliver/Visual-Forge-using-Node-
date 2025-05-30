import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
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
@UseGuards(AuthGuard, RolesGuard)
export class EditorsController {
  private readonly logger = new Logger(EditorsController.name);
  constructor(
    private editorService: EditorsService,
  ) { };

  @Get('quotations')
  @Roles('Editor')
  async getQuotations(@Req() req: Request, @Query('status') status: string) {
    const editor = req['user'] as { userId: Types.ObjectId, role: string };

    if (status === 'accepted') {
      return this.editorService.getAcceptedQuotations(editor.userId);
    } else {
      return this.editorService.getPublishedQuotations(editor.userId);
    }
  }

  @Post('quotations/:quotationId/accept')
  @Roles('Editor')
  async acceptQuotation(@Param('quotationId') quotationId: string, @Req() req: Request) {
    const user = req['user'] as { userId: Types.ObjectId, role: string };
    return this.editorService.acceptQuotation(quotationId, user.userId);
  }

  @Post('quotations/response')
  @Roles('Editor')
  async submitQuotationResponse(@Body() workData: any): Promise<boolean> {
    return this.editorService.submitQuotationResponse(workData);
  }

  @Post('uploads/work')
  @Roles('Editor')
  @UseInterceptors(FilesInterceptor('files', 3))
  async uploadWorkFiles(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    this.logger.log(`Uploading ${files.length} files`);
    return this.editorService.uploadWorkFiles(files, folder);
  }

  @Get('works')
  @Roles('Editor')
  async getCompletedWorks(@Req() req: Request): Promise<any[]> {
    const editor = req['user'] as { userId: Types.ObjectId, role: string };
    return this.editorService.getCompletedWorks(editor.userId);
  }

  @Post('bids')
  @Roles('Editor')
  async createBid(@Body() bidData: { quotationId: string, bidAmount: number, notes?: string }, @Req() req: Request) {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidData.quotationId)) {
      throw new BadRequestException('Invalid quotation ID');
    }

    if (bidData.bidAmount <= 0) {
      throw new BadRequestException('Bid amount must be greater than 0');
    }

    return this.editorService.createBid(
      new Types.ObjectId(bidData.quotationId),
      editor.userId,
      bidData.bidAmount,
      bidData.notes
    );
  }

  @Get('bids')
  @Roles('Editor')
  async getEditorBids(@Req() req: Request) {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };
    return this.editorService.getEditorBids(new Types.ObjectId(editor.userId));
  }

  @Patch('bids/:bidId')
  @Roles('Editor')
  async updateBid(@Param('bidId') bidId: string, @Body() bidData: { bidAmount: number, notes?: string }, @Req() req: Request) {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidId)) {
      throw new BadRequestException('Invalid bid ID');
    }
    return this.editorService.updateBid(new Types.ObjectId(bidId), new Types.ObjectId(editor.userId), bidData.bidAmount, bidData.notes);
  }

  @Delete('bids/:bidId')
  @Roles('Editor')
  async deleteBid(@Param('bidId') bidId: string, @Req() req: Request) {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidId)) {
      throw new BadRequestException('Invalid bid ID');
    }

    return this.editorService.deleteBid(new Types.ObjectId(bidId), new Types.ObjectId(editor.userId));
  }
}
