import { Body, Controller, Get, Logger, Patch, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private userService: UsersService){};

    @Get('profile')
    // @Roles('User')
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
    @Roles('User')
    async createQuotation(@Req() req: Request, @Body() body){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const success = await this.userService.createQuotation(body.quotation,user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Patch('profile-image')
    @Roles('User')
    async updateProfileImage(@Req() req: Request, @Body() body){
        const user = req['user'] as { userId: Types.ObjectId, role: string}
        const success = await this.userService.updateProfileImage(body.url, user.userId);
        if(success){
            return true;
        }
        return false;
    }

    @Post('quotation/files-upload')
    @Roles('User')
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
}
