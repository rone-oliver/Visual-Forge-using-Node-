import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from './models/user.schema';
import { EditorsService } from 'src/editors/editors.service';
import { PaymentService } from 'src/common/payment/payment.service';
import { PaymentType } from 'src/common/models/transaction.schema';
import { Quotation } from 'src/common/models/quotation.schema';

@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(
        private userService: UsersService,
        private editorService: EditorsService,
        private paymentService: PaymentService,
    ) { };

    @Get('profile')
    @Roles('User', 'Editor')
    async getUserProfile(@Req() req: Request) {
        console.log('controlled hitted on /user/profile');
        const user = req['user'] as { userId: Types.ObjectId; role: string }
        const userDet = await this.userService.getUserDetails(user.userId);
        console.log('user profile data', userDet);
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
        return { status };
    }

    @Get('quotations')
    @Roles('User', 'Editor')
    async getQuotations(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const quotations = await this.userService.getQuotations(user.userId);
        return quotations;
    }

    @Post('quotations')
    @Roles('User', 'Editor')
    async createQuotation(@Req() req: Request, @Body() body) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        const success = await this.userService.createQuotation(body.quotation, user.userId);
        if (success) {
            return true;
        }
        return false;
    }

    @Get('quotations/:quotationId')
    @Roles('User','Editor')
    async getQuotation(@Param('quotationId') quotationId: string){
        return await this.userService.getQuotation(new Types.ObjectId(quotationId));
    }

    @Patch('quotations/:quotationId')
    @Roles('User','Editor')
    async updateQuotation(@Param('quotationId') quotationId: string, @Body() body: { quotation: Partial<Quotation> }) {
        return await this.userService.updateQuotation(new Types.ObjectId(quotationId), body.quotation);
    }

    @Delete('quotations/:quotationId')
    @Roles('User','Editor')
    async deleteQuotation(@Param('quotationId') quotationId: string){
        return await this.userService.deleteQuotation(new Types.ObjectId(quotationId));
    }

    @Patch('profile/image')
    @Roles('User', 'Editor')
    async updateProfileImage(@Req() req: Request, @Body() body) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.updateProfileImage(body.url, user.userId);
        if (success) {
            return true;
        }
        return false;
    }

    @Patch('profile')
    @Roles('User', 'Editor')
    async updateProfile(@Req() req: Request, @Body() body) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.updateProfile(body, user.userId);
        if (success) {
            return true;
        }
        return false;
    }

    @Patch('reset-password')
    @Roles('User', 'Editor')
    async resetPassword(@Req() req: Request, @Body() body: { currentPassword: string, newPassword: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        try {
            const response = await this.userService.resetPassword(body, user.userId);
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
    ) {
        this.logger.log(`Uploading ${files.length} files`);
        const result = await this.userService.uploadFiles(files, folder);
        return result;
    }

    @Get('quotations/completed')
    // GET /quotations?status=completed
    @Roles('User', 'Editor')
    async getCompletedWorks(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const quotations = await this.userService.getCompletedWorks(user.userId);
        return quotations;
    }

    @Put('quotations/:workId/rating')
    @Roles('User', 'Editor')
    async rateWork(@Req() req: Request, @Param('workId') workId: string, @Body() body: { rating: number, feedback: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        console.log('worksId from controller:', workId);
        const success = await this.userService.rateWork(workId, body.rating, body.feedback);
        if (success) {
            return true;
        }
        return false;
    }

    @Patch('quotations/:workId/public')
    async updateWorkPublicStatus(@Req() req: Request, @Param('workId') workId: string, @Body() body: { isPublic: boolean }) {
        const success = await this.userService.updateWorkPublicStatus(workId, body.isPublic)
        if (success) {
            return true
        }
        return false
    }

    @Post('editor/rating')
    @Roles('User', 'Editor')
    async rateEditor(@Req() req: Request, @Body() body: { editorId: string, rating: number, feedback: string }) {
        this.logger.log('rating editor:', body.editorId, body.rating, body.feedback);
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const success = await this.userService.rateEditor(body.editorId, body.rating, body.feedback, user.userId);
        if (success) {
            return true;
        }
        return false;
    }

    @Get('editor/rating')
    @Roles('User', 'Editor')
    async getCurrentEditorRating(@Req() req: Request, @Query('editorId') editorId: string) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const rating = await this.userService.getCurrentEditorRating(editorId, user.userId);
        return rating;
    }

    @Get('works/public')
    @Roles('User', 'Editor')
    async getPublicWorks(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('search') search?: string,
        @Query('rating') rating?: number,
    ) {
        const works = await this.userService.getPublicWorks(page, limit, rating, search);
        return works;
    }

    @Get('')
    async getUser(@Query('id') id: string): Promise<User> {
        console.log('getUser controller hit. id: ',id);
        return this.userService.getUser(new Types.ObjectId(id));
    }

    @Get('users')
    async getUsers(@Req() req: Request): Promise<User[]> {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        return this.userService.getUsers(new Types.ObjectId(user.userId));
    }

    @Get('editors/:id')
    async getEditor(@Param('id') id: string): Promise<User & { editorDetails?: any } | null> {
        return this.editorService.getEditor(id);
    }

    @Post('payment')
    @Roles('User', 'Editor')
    async createPayment(@Req() req: Request, @Body() body: { amount: number, currency?: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const payment = await this.paymentService.createRazorpayOrder(body.amount, body.currency);
        return payment;
    }

    @Post('payment/verify')
    @Roles('User', 'Editor')
    async verifyPayment(@Req() req: Request, @Body() body: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string }
        const payment = await this.paymentService.verifyPayment(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
        return payment;
    }

    @Patch('quotations/:quotationId/payment')
    @Roles('User', 'Editor')
    async updateQuotationPayment(@Req() req: Request, @Param('quotationId') quotationId: string, @Body() body: { isAdvancePaid: boolean, orderId: string, paymentId: string, amount: number }) {
        const user = req['user'] as { userId: Types.ObjectId, role: string };
        const paymentType = body.isAdvancePaid ? PaymentType.BALANCE : PaymentType.ADVANCE;

        const paymentDetails = {
            paymentId: body.paymentId,
            orderId: body.orderId,
            amount: body.amount,
            paymentType: paymentType
        };
        console.log('paymentDetails: ',paymentDetails);

        const success = await this.userService.createTransaction(user.userId, new Types.ObjectId(quotationId), paymentDetails);
        if (success) {
            return true;
        }
        return false;
    }

    @Get('quotations/:quotationId/bids')
    @Roles('User','Editor')
    async getBidsByQuotation(@Param('quotationId') quotationId: string, @Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        
        if (!Types.ObjectId.isValid(quotationId)) {
            throw new BadRequestException('Invalid quotation ID');
        }
        
        return this.userService.getBidsByQuotation(new Types.ObjectId(quotationId), new Types.ObjectId(user.userId));
    }

    @Get('quotations/bid-counts')
    @Roles('User','Editor')
    async getBidCountsForUserQuotations(@Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        return this.userService.getBidCountsForUserQuotations(user.userId);
    }

    @Post('bids/:bidId/accept')
    @Roles('User','Editor')
    async acceptBid(@Param('bidId') bidId: string, @Req() req: Request) {
        const user = req['user'] as { userId: Types.ObjectId; role: string };
        
        if (!Types.ObjectId.isValid(bidId)) {
            throw new BadRequestException('Invalid bid ID');
        }
        
        return this.userService.acceptBid(new Types.ObjectId(bidId), user.userId);
    }
}
