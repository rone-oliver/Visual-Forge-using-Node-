import { BadRequestException, Body, Controller, Get, Logger, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from './models/user.schema';

@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private userService: UsersService){};

    @Get('profile')
    @Roles('User','Editor')
    async getUserProfile(@Req() req: Request){
        console.log('controlled hitted on /user/profile');
        const user = req['user'] as { userId: Types.ObjectId; role: string}
        const userDet = await this.userService.getUserDetails(user.userId);
        console.log('user profile data',userDet);
        return userDet;
    }

    @Post('editorRequest')
    @Roles('User')
    async requestForEditor(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const response = await this.userService.requestForEditor(user.userId);
        return response;
    }

    @Get('editorRequest/status')
    @Roles('User')
    async getEditorRequestStatus(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const status = await this.userService.getEditorRequestStatus(user.userId);
        return {status};
    }

    @Get('quotations')
    @Roles('User','Editor')
    async getQuotations(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const quotations = await this.userService.getQuotations(user.userId);
        return quotations;
    }

    @Post('create-quotation')
    @Roles('User','Editor')
    async createQuotation(@Req() req: Request, @Body() body){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const success = await this.userService.createQuotation(body.quotation,user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Patch('profile-image')
    @Roles('User','Editor')
    async updateProfileImage(@Req() req: Request, @Body() body){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const success = await this.userService.updateProfileImage(body.url, user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Post('quotation/files-upload')
    @Roles('User','Editor')
    @UseInterceptors(FilesInterceptor('files',5))
    async uploadFile(
        @Req() req: Request, 
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ){
        this.logger.log(`Uploading ${files.length} files`);
        const result = await this.userService.uploadFiles(files,folder);
        return result;
    }

    @Patch('profile/update')
    @Roles('User','Editor')
    async updateProfile(@Req() req: Request, @Body() body){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const success = await this.userService.updateProfile(body, user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Patch('reset-password')
    @Roles('User','Editor')
    async resetPassword(@Req() req: Request, @Body() body:{currentPassword: string, newPassword: string}){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        try {
            const response = await this.userService.resetPassword(body, user.userId);
            return response;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Get('quotations/completed')
    @Roles('User','Editor')
    async getCompletedWorks(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const quotations = await this.userService.getCompletedWorks(user.userId);
        return quotations;
    }

    @Post('quotations/rate')
    @Roles('User','Editor')
    async rateWork(@Req() req: Request, @Body() body:{workId: string, rating: number, feedback: string}){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        console.log('worksId from controller:',body.workId);
        const success = await this.userService.rateWork(body.workId, body.rating, body.feedback);
        if(success){
            return true;
        }
        return false;
    }

    @Post('editor/rate')
    @Roles('User','Editor')
    async rateEditor(@Req() req: Request, @Body() body:{editorId: string, rating: number, feedback: string}){
        this.logger.log('rating editor:',body.editorId,body.rating,body.feedback);
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const success = await this.userService.rateEditor(body.editorId, body.rating, body.feedback, user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Get('editor/rating')
    @Roles('User','Editor')
    async getCurrentEditorRating(@Req() req: Request, @Query('editorId') editorId: string){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const rating = await this.userService.getCurrentEditorRating(editorId,user.userId);
        return rating;
    }

    @Patch('quotations/:workId/public')
    async updateWorkPublicStatus(@Req() req: Request, @Param('workId') workId: string, @Body() body: { isPublic: boolean }) {
        const success = await this.userService.updateWorkPublicStatus(workId, body.isPublic)
        if (success) {
            return true
        }
        return false
    }

    @Get('works/public')
    @Roles('User','Editor')
    async getPublicWorks(@Req() req: Request, @Query('page') page: number, @Query('limit') limit: number){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const works = await this.userService.getPublicWorks(page, limit);
        return works;
    }

    @Get(':id')
    async getEditor(@Param('id') id: string): Promise<User> {
        return this.userService.getUser(id);
    }
}
