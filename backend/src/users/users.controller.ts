import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Inject, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Types } from 'mongoose';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { IPaymentService, IPaymentServiceToken } from 'src/common/payment/interfaces/payment-service.interface';
import { PaymentType } from 'src/common/transaction/models/transaction.schema';
import { Quotation, QuotationStatus } from 'src/quotation/models/quotation.schema';
import { FileUploadResultDto as FileUploadResultDtoCloudinary } from 'src/common/cloudinary/dtos/cloudinary.dto';
import {
    BidResponseDto,
    CreatePaymentDto,
    CreatePaymentResponseDto,
    CreateQuotationDto,
    GetQuotationsParamsDto,
    PaginatedQuotationsResponseDto,
    PaginatedTransactionsResponseDto,
    RateEditorDto,
    SuccessResponseDto,
    UpdateProfileDto,
    UpdateProfileImageDto,
    UpdateQuotationDto,
    UpdateQuotationPaymentDto,
    UserBasicInfoDto,
    UserEditorRatingDto,
    UserProfileResponseDto,
    EditorPublicProfileResponseDto,
    GetPublicEditorsDto,
    PaginatedPublicEditorsDto,
    ReportUserDto,
    SubmitFeedbackDto
} from './dto/users.dto';
import { IUsersService, IUsersServiceToken } from './interfaces/users.service.interface';
import { IUsersController } from './interfaces/users.controller.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Bid } from 'src/common/bids/models/bids.schema';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';
import { GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, UpdateWorkPublicStatusDto } from 'src/works/dtos/works.dto';
import { Public } from 'src/auth/decorators/public.decorator';

export interface GetQuotationsParams {
    page?: number;
    limit?: number;
    status?: QuotationStatus | 'All';
    searchTerm?: string;
}

export interface QuotationWithBidCount extends Quotation {
    bidCount?: number;
}

export interface PaginatedQuotationsResponse {
    quotations: QuotationWithBidCount[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController implements IUsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(
        @Inject(IUsersServiceToken) private readonly userService: IUsersService,
        @Inject(IPaymentServiceToken) private paymentService: IPaymentService,
        @Inject(IQuotationServiceToken) private quotationService: IQuotationService,
    ) { };

    @Get('profile')
    @Roles(Role.USER, Role.EDITOR)
    async getUserProfile(@Req() req: Request): Promise<UserProfileResponseDto> {
        console.log('controller hitted on /user/profile');
        const user = req['user'] as { userId: Types.ObjectId; role: string }
        const userDet = await this.userService.getUserDetails(user.userId);
        console.log('user profile data', userDet);
        if (!userDet) {
            throw new NotFoundException('User not found');
        }
        return userDet;
    }

    @Post('editor-requests')
    @Roles('User')
    async requestForEditor(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const response = await this.userService.requestForEditor(user.userId);
        return response;
    }

    @Get('editor-requests')
    @Roles('User')
    async getEditorRequestStatus(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const status = await this.userService.getEditorRequestStatus(user.userId);
        return status;
    }

    @Get('transactions')
    @Roles('User', 'Editor')
    async getTransactionHistory(
        @Req() req: Request,
        @Query() query: GetQuotationsParamsDto,
    ): Promise<PaginatedTransactionsResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const params = {
            page: query.page ? parseInt(query.page.toString(), 10) : 1,
            limit: query.limit ? parseInt(query.limit.toString(), 10) : 10,
        };
        return this.userService.getTransactionHistory(user.userId.toString(), params);
    }

    @Get('quotations')
    @Roles('User', 'Editor')
    async getQuotations(
        @Req() req: Request,
        @Query() query: GetQuotationsParamsDto,
    ): Promise<PaginatedQuotationsResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const params: GetQuotationsParams = {
            page: query.page ? parseInt(query.page.toString(), 10) : undefined,
            limit: query.limit ? parseInt(query.limit.toString(), 10) : undefined,
            status: query.status,
            searchTerm: query.searchTerm,
        }
        return this.userService.getQuotations(user.userId, params);
    }

    @Get('quotations/completed')
    // GET /quotations?status=completed
    @Roles('User', 'Editor')
    async getCompletedWorks(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const quotations = await this.userService.getCompletedWorks(user.userId);
        return quotations;
    }

    @Get('quotations/:quotationId')
    @Roles('User', 'Editor')
    async getQuotation(@Param('quotationId') quotationId: string) {
        return await this.userService.getQuotation(new Types.ObjectId(quotationId));
    }

    @Get('quotations/:quotationId/bids')
    @Roles('User', 'Editor')
    async getBidsByQuotation(@Param('quotationId') quotationId: string, @Req() req: Request): Promise<BidResponseDto[]> {
        const user = req['user'] as { userId: Types.ObjectId; role: string };

        if (!Types.ObjectId.isValid(quotationId)) {
            throw new BadRequestException('Invalid quotation ID');
        }

        return this.userService.getBidsByQuotation(new Types.ObjectId(quotationId), new Types.ObjectId(user.userId));
    }

    @Post('quotations')
    @Roles('User', 'Editor')
    async createQuotation(@Req() req: Request, @Body() body: { quotation: CreateQuotationDto }): Promise<SuccessResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const success = await this.userService.createQuotation(user.userId, body.quotation);
        if (success) {
            return { success: true };
        }
        return { success: false };
    }

    @Patch('quotations/:quotationId')
    @Roles('User', 'Editor')
    async updateQuotation(@Param('quotationId') quotationId: string, @Body() dto: UpdateQuotationDto) {
        return await this.userService.updateQuotation(new Types.ObjectId(quotationId), dto);
    }

    @Delete('quotations/:quotationId')
    @Roles('User', 'Editor')
    async deleteQuotation(@Param('quotationId') quotationId: string) {
        return await this.userService.deleteQuotation(new Types.ObjectId(quotationId));
    }

    @Patch('profile/image')
    @Roles('User', 'Editor')
    async updateProfileImage(@Req() req: Request, @Body() dto: UpdateProfileImageDto): Promise<SuccessResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.updateProfileImage(user.userId, dto.profileImageUrl);
        if (success) {
            return { success: true };
        }
        return { success: false };
    }

    @Patch('profile')
    @Roles('User', 'Editor')
    async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto): Promise<SuccessResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.updateProfile(user.userId, dto);
        if (success) {
            return { success: true };
        }
        return { success: false };
    }

    @Patch('reset-password')
    @Roles('User', 'Editor')
    async resetPassword(@Req() req: Request, @Body() body: { currentPassword: string, newPassword: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        try {
            const response = await this.userService.resetPassword(user.userId, body);
            return response;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('quotations/upload')
    @Roles('User', 'Editor')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFile(
        @Req() req: Request,
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ): Promise<FileUploadResultDtoCloudinary[]> {
        this.logger.log(`Uploading ${files.length} files`);
        const result = await this.userService.uploadFiles(files, folder);
        return result;
    }

    @Put('quotations/:workId/rating')
    @Roles('User', 'Editor')
    async rateWork(@Req() req: Request, @Param('workId') workId: string, @Body() body: UserEditorRatingDto) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        console.log('worksId from controller:', workId);
        const success = await this.userService.rateWork(workId, body);
        if (!success) {
            throw new InternalServerErrorException('Work rating failed');
        }
        return true;
    }

    @Patch('quotations/:workId/public')
    async updateWorkPublicStatus(@Req() req: Request, @Param('workId') workId: string, @Body() body: UpdateWorkPublicStatusDto) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.updateWorkPublicStatus(workId, body);
        if (!success) {
            throw new InternalServerErrorException('Work Status update failed')
        }
        return true;
    }

    @Post('editor/rating')
    @Roles('User', 'Editor')
    async rateEditor(@Req() req: Request, @Body() body: RateEditorDto): Promise<SuccessResponseDto> {
        this.logger.log('rating editor:', body.editorId, body.rating, body.feedback);
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        return await this.userService.rateEditor(user.userId, body);
    }

    @Get('editor/rating')
    @Roles('User', 'Editor')
    async getCurrentEditorRating(@Req() req: Request, @Query('editorId') editorId: string) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const rating = await this.userService.getCurrentEditorRating(user.userId, editorId);
        return rating;
    }

    @Get('works/public')
    @Roles('User', 'Editor')
    async getPublicWorks(
        @Query() query: GetPublicWorksQueryDto,
    ): Promise<PaginatedPublicWorksResponseDto> {
        const works = await this.userService.getPublicWorks(query);
        return works;
    }

    // @Get('')
    // async getUser(@Query('id') id: string): Promise<UserBasicInfoDto> {
    //     console.log('getUser controller hit. id: ',id);
    //     const user = await this.userService.getUser(new Types.ObjectId(id));
    //     if (!user) {
    //         throw new NotFoundException('User not found');
    //     }
    //     return user;
    // }

    @Post('works/:workId/feedback')
    @Roles(Role.USER, Role.EDITOR)
    @ApiOperation({ summary: 'Submit feedback for a completed work' })
    @ApiResponse({ status: 201, description: 'Feedback submitted successfully.', type: SuccessResponseDto })
    async submitWorkFeedback(
        @Param('workId') workId: string,
        @Body() feedbackDto: SubmitFeedbackDto,
        @GetUser('userId') userId: string,
    ): Promise<SuccessResponseDto> {
        if (!Types.ObjectId.isValid(workId)) {
            throw new BadRequestException('Invalid work ID');
        }
        return this.userService.submitWorkFeedback(new Types.ObjectId(workId), new Types.ObjectId(userId), feedbackDto.feedback);
    }

    @Patch('works/:workId/satisfied')
    @Roles(Role.USER)
    @ApiOperation({ summary: 'Mark a work as satisfied' })
    @ApiResponse({ status: 200, description: 'Work marked as satisfied successfully.', type: SuccessResponseDto })
    async markWorkAsSatisfied(
        @Param('workId') workId: string,
        @GetUser('userId') userId: string,
    ): Promise<SuccessResponseDto> {
        if (!Types.ObjectId.isValid(workId)) {
            throw new BadRequestException('Invalid work ID');
        }
        await this.userService.markWorkAsSatisfied(new Types.ObjectId(workId), new Types.ObjectId(userId));
        return { success: true, message: 'Work marked as satisfied successfully.' };
    }

    @Get('users')
    async getUsers(@Req() req: Request): Promise<UserBasicInfoDto[]> {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        return this.userService.getUsers(new Types.ObjectId(user.userId));
    }

    // @Get('editors/:id')
    // async getEditor(@Param('id') id: string): Promise<EditorDetailsResponseDto | null> {
    //     return this.editorService.getEditor(id);
    // }

    @Get('profile/editors/:id')
    @Roles(Role.USER, Role.EDITOR)
    @ApiOperation({ summary: "Get an editor's public profile" })
    @ApiResponse({ status: 200, description: 'Returns the public profile of the editor.', type: EditorPublicProfileResponseDto })
    @ApiResponse({ status: 404, description: 'Editor not found.' })
    async getEditorPublicProfile(
        @Param('id') id: string,
        @GetUser('userId') userId: string,
    ): Promise<EditorPublicProfileResponseDto> {
        return this.userService.getEditorPublicProfile(id, userId);
    }

    @Post('payment')
    @Roles('User', 'Editor')
    async createPayment(@Req() req: Request, @Body() body: CreatePaymentDto): Promise<CreatePaymentResponseDto> {
        const quotation = await this.quotationService.findById(new Types.ObjectId(body.quotationId));
        if (quotation) {
            if (quotation.isPaymentInProgress) {
                this.logger.warn('An existing payment is in progress');
                throw new ConflictException({
                    retryInMinutes: 10,
                    message: 'A payment is already in Progress!'
                });
            }
        }
        const razorpayOrder = await this.paymentService.createRazorpayOrder(body.amount, body.currency, body.quotationId);
        if (razorpayOrder) {
            await this.quotationService.updateQuotation(
                { _id: body.quotationId },
                { isPaymentInProgress: true, }
            )
        }

        // Explicitly map RazorpayOrder to CreatePaymentResponseDto
        const response: CreatePaymentResponseDto = {
            id: razorpayOrder.id,
            entity: razorpayOrder.entity,
            amount: Number(razorpayOrder.amount), // Ensure this is a number
            amount_paid: Number(razorpayOrder.amount_paid), // Ensure this is a number
            amount_due: Number(razorpayOrder.amount_due), // Ensure this is a number
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt ?? undefined, // Handle possible null from Razorpay
            offer_id: razorpayOrder.offer_id ?? undefined, // Handle possible null from Razorpay
            status: razorpayOrder.status,
            attempts: razorpayOrder.attempts,
            // Assuming razorpayOrder.notes is compatible with any[] or needs specific mapping
            // Based on your DTO (any[]) and sample (notes: []), direct assignment might be okay if SDK type matches.
            // If razorpayOrder.notes is an object, you might need: Array.isArray(razorpayOrder.notes) ? razorpayOrder.notes : (razorpayOrder.notes ? [razorpayOrder.notes] : [])
            notes: razorpayOrder.notes ? [razorpayOrder.notes] : [],
            created_at: razorpayOrder.created_at,
        };

        return response;
    }

    @Post('payment/verify')
    @Roles(Role.USER, Role.EDITOR)
    async verifyPayment(@Req() req: Request, @Body() body: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const payment = await this.paymentService.verifyPayment(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
        return payment;
    }

    @Patch('quotations/:quotationId/payment')
    @Roles('User', 'Editor')
    async updateQuotationPayment(@Req() req: Request, @Param('quotationId') quotationId: string, @Body() body: UpdateQuotationPaymentDto): Promise<SuccessResponseDto> {
        console.log('updateQuotationPayment controller hit: ', body);
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const paymentType = body.isAdvancePaid ? PaymentType.BALANCE : PaymentType.ADVANCE;

        const paymentDetails = {
            paymentId: body.paymentId,
            orderId: body.orderId,
            amount: body.amount,
            paymentType: paymentType,
            razorpayPaymentMethod: body.razorpayPaymentMethod,
            currency: body.currency,
            bank: body.bank,
            fee: body.fee,
            tax: body.tax,
            wallet: body.wallet,
            paymentDate: body.paymentDate
        };
        console.log('paymentDetails: ', paymentDetails);

        const success = await this.userService.createTransaction(user.userId, new Types.ObjectId(quotationId), paymentDetails);
        if (!success) {
            throw new InternalServerErrorException('Create Transaction failed for quotationId: ', quotationId)
        }
        return { success: true };
    }

    @Post('bids/:bidId/accept')
    @Roles('User', 'Editor')
    async acceptBid(@Param('bidId') bidId: string, @Req() req: Request): Promise<BidResponseDto> {
        const user = req['user'] as { userId: Types.ObjectId; role: string };

        if (!Types.ObjectId.isValid(bidId)) {
            throw new BadRequestException('Invalid bid ID');
        }

        return this.userService.acceptBid(new Types.ObjectId(bidId), user.userId);
    }

    @Get('bids/:quotationId/accepted')
    @Roles(Role.USER, Role.EDITOR)
    async getAcceptedBid(
        @Param('quotationId') quotationId: string,
        @Query('editorId') editorId: string,
    ): Promise<Bid> {
        if (!Types.ObjectId.isValid(quotationId)) {
            throw new BadRequestException('Invalid quotation ID');
        }

        return this.userService.getAcceptedBid(new Types.ObjectId(quotationId), new Types.ObjectId(editorId));
    }

    @Patch('bids/:bidId/cancel')
    @Roles(Role.USER, Role.EDITOR)
    @ApiOperation({ summary: 'Cancel an accepted bid before payment' })
    @ApiResponse({ status: 200, description: 'Bid cancelled successfully.', type: SuccessResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid request or bid cannot be cancelled.' })
    async cancelAcceptedBid(
        @Param('bidId') bidId: string,
        @GetUser('userId') requesterId: string,
    ): Promise<SuccessResponseDto> {
        if (!Types.ObjectId.isValid(bidId)) {
            throw new BadRequestException('Invalid bid ID');
        }
        return await this.userService.cancelAcceptedBid(new Types.ObjectId(bidId), new Types.ObjectId(requesterId));
    }

    @Public()
    @Get('editors')
    @ApiOperation({ summary: 'Get a list of public editor profiles' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved public editor profiles.', type: PaginatedPublicEditorsDto })
    getPublicEditors(
        @Query() query: GetPublicEditorsDto,
    ): Promise<PaginatedPublicEditorsDto> {
        return this.userService.getPublicEditors(query);
    }

    @Post('reports')
    async reportUser(
        @Body() reportDto: ReportUserDto,
        @GetUser('userId') userId: string,
    ): Promise<SuccessResponseDto> {
        return this.userService.reportUser(reportDto, userId);
    }

    @Post('follow/:id')
    @Roles(Role.USER, Role.EDITOR)
    @ApiOperation({ summary: 'Follow a user' })
    @ApiResponse({ status: 200, description: 'Successfully followed user.' })
    async followUser(@Param('id') id: string, @GetUser('userId') userId: string): Promise<SuccessResponseDto> {
        const sourceUserId = new Types.ObjectId(userId);
        const targetUserId = new Types.ObjectId(id);
        return this.userService.followUser(sourceUserId, targetUserId);
    }

    @Delete('follow/:id')
    @Roles(Role.USER, Role.EDITOR)
    @ApiOperation({ summary: 'Unfollow a user' })
    @ApiResponse({ status: 200, description: 'Successfully unfollowed user.' })
    async unfollowUser(@Param('id') id: string, @GetUser('userId') userId: string): Promise<SuccessResponseDto> {
        const sourceUserId = new Types.ObjectId(userId);
        const targetUserId = new Types.ObjectId(id);
        return this.userService.unfollowUser(sourceUserId, targetUserId);
    }
}