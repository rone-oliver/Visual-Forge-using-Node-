import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors, Inject } from '@nestjs/common';
import { IEditorsService, IEditorsServiceToken } from './interfaces/editors.service.interface';
import { Types } from 'mongoose';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { OutputType, QuotationStatus } from 'src/common/models/quotation.schema';
import {
  GetPublishedQuotationsQueryDto,
  GetAcceptedQuotationsQueryDto,
  SubmitWorkBodyDto,
  CreateEditorBidBodyDto,
  UpdateEditorBidBodyDto,
  PaginatedAcceptedQuotationsResponseDto,
  FileUploadResultDto,
  BidResponseDto,
  CompletedWorkDto,
  PaginatedPublishedQuotationsResponseDto,
  AddTutorialDto,
  RemoveTutorialDto
} from './dto/editors.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { IEditorsController } from './interfaces/editors.controller.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Editor } from './models/editor.schema';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('editor')
@Controller('editor')
@UseGuards(AuthGuard, RolesGuard)
export class EditorsController implements IEditorsController {
  private readonly logger = new Logger(EditorsController.name);
  constructor(
    @Inject(IEditorsServiceToken) private editorService: IEditorsService,
  ) { };

  @Get('quotations')
  @Roles('Editor')
  @ApiOperation({ summary: 'Get quotations for the editor (published or accepted)' })
  @ApiQuery({ name: 'status', enum: QuotationStatus, description: 'Filter quotations by status (Published, Accepted)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'searchTerm', required: false, type: String, description: 'Search term for filtering' })
  @ApiQuery({ name: 'mediaType', required: false, type: String, description: 'Filter by media type (for published quotations)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved quotations. Type depends on status query param.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PaginatedAcceptedQuotationsResponseDto) },
        { $ref: getSchemaPath(PaginatedPublishedQuotationsResponseDto) },
      ],
    }
  })
  async getQuotations(
    @Req() req: Request,
    @Query('status') status: QuotationStatus,
    @Query() queryDto: GetPublishedQuotationsQueryDto & GetAcceptedQuotationsQueryDto,
  ): Promise<PaginatedAcceptedQuotationsResponseDto | PaginatedPublishedQuotationsResponseDto> {
    const editor = req['user'] as { userId: Types.ObjectId, role: string };
    const pageNumber = parseInt(queryDto.page ? queryDto.page.toString() : '1', 10);
    const limitNumber = parseInt(queryDto.limit ? queryDto.limit.toString() : '15', 10);

    if (status === QuotationStatus.ACCEPTED) {
      const acceptedQueryDto: GetAcceptedQuotationsQueryDto = { page: pageNumber, limit: limitNumber, searchTerm: queryDto.searchTerm };
      return this.editorService.getAcceptedQuotations(editor.userId, acceptedQueryDto);
    } else if (status === QuotationStatus.PUBLISHED) {
      const publishedQueryDto: GetPublishedQuotationsQueryDto = { page: pageNumber, limit: limitNumber, mediaType: queryDto.mediaType, searchTerm: queryDto.searchTerm };
      return this.editorService.getPublishedQuotations(editor.userId, publishedQueryDto);
    }
    throw new BadRequestException('Invalid quotation status provided.');
  }

  @Post('quotations/response')
  @Roles('Editor')
  @ApiOperation({ summary: 'Submit completed work for a quotation' })
  @ApiBody({ type: SubmitWorkBodyDto })
  @ApiResponse({ status: 201, description: 'Work submitted successfully.', type: Boolean })
  async submitQuotationResponse(
    @Req() req: Request,
    @Body() workData: SubmitWorkBodyDto
  ): Promise<boolean> {
    const editor = req['user'] as { userId: Types.ObjectId, role: string };
    return this.editorService.submitQuotationResponse(editor.userId, workData);
  }

  @Post('uploads/work')
  @Roles('Editor')
  @UseInterceptors(FilesInterceptor('files', 3))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload work files for a quotation' })
  @ApiBody({
    description: 'Files to upload and optional folder name',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        folder: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully.', type: [FileUploadResultDto] })
  async uploadWorkFiles(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<FileUploadResultDto[]> {
    this.logger.log(`Uploading ${files.length} files`);
    return this.editorService.uploadWorkFiles(files, folder);
  }

  @Get('works')
  @Roles('Editor')
  @ApiOperation({ summary: 'Get all completed works by the editor' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved completed works.', type: [CompletedWorkDto] })
  async getCompletedWorks(@Req() req: Request): Promise<CompletedWorkDto[]> {
    const editor = req['user'] as { userId: Types.ObjectId, role: string };
    return this.editorService.getCompletedWorks(editor.userId);
  }

  @Post('bids')
  @Roles('Editor')
  @ApiOperation({ summary: 'Create a new bid for a quotation' })
  @ApiBody({ type: CreateEditorBidBodyDto })
  @ApiResponse({ status: 201, description: 'Bid created successfully.', type: BidResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async createBid(@Body() bidData: CreateEditorBidBodyDto, @Req() req: Request): Promise<BidResponseDto> {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidData.quotationId)) {
      throw new BadRequestException('Invalid quotation ID');
    }

    // Validation for bidAmount is handled by DTO's Min(0.01) decorator
    return this.editorService.createBid(editor.userId, bidData);
  }

  @Patch('bids/:bidId')
  @Roles('Editor')
  @ApiOperation({ summary: 'Update an existing bid' })
  @ApiBody({ type: UpdateEditorBidBodyDto })
  @ApiResponse({ status: 200, description: 'Bid updated successfully.', type: BidResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid bid ID or input data.' })
  async updateBid(
    @Param('bidId') bidId: string,
    @Body() bidData: UpdateEditorBidBodyDto,
    @Req() req: Request
  ): Promise<BidResponseDto> {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidId)) {
      throw new BadRequestException('Invalid bid ID');
    }
    return this.editorService.updateBid(new Types.ObjectId(bidId), new Types.ObjectId(editor.userId), bidData);
  }

  @Delete('bids/:bidId')
  @Roles('Editor')
  @ApiOperation({ summary: 'Delete a bid' })
  @ApiResponse({ status: 200, description: 'Bid deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid bid ID.' })
  async deleteBid(@Param('bidId') bidId: string, @Req() req: Request): Promise<void> {
    const editor = req['user'] as { userId: Types.ObjectId; role: string };

    if (!Types.ObjectId.isValid(bidId)) {
      throw new BadRequestException('Invalid bid ID');
    }

    await this.editorService.deleteBid(new Types.ObjectId(bidId), new Types.ObjectId(editor.userId));
  }

  @Post('tutorials')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Add a new tutorial to the editor\'s profile' })
  @ApiBody({ type: AddTutorialDto })
  @ApiResponse({ status: 201, description: 'Tutorial added successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async addTutorial(
    @Body() addTutorialDto: AddTutorialDto,
    @GetUser('userId') editorId: string
  ): Promise<Editor> {
    return this.editorService.addTutorial(editorId, addTutorialDto);
  }

  @Delete('tutorials')
  @ApiOperation({ summary: 'Remove a tutorial from the editor\'s profile' })
  @ApiBody({ type: RemoveTutorialDto })
  @ApiResponse({ status: 200, description: 'Tutorial removed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @Roles(Role.EDITOR)
  async removeTutorial(@GetUser('userId') editorId: string, @Body() removeTutorialDto: RemoveTutorialDto) {
    return this.editorService.removeTutorial(editorId, removeTutorialDto);
  }
}
