import { Controller, Get, Post, Req } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
    constructor(private userService: UsersService){};

    @Get('profile')
    async getUserProfile(@Req() req: Request){
        console.log('controlled hitted on /user/profile');
        const user = req['user'] as { userId: Types.ObjectId; role: string}
        const userDet = await this.userService.getUserDetails(user.userId);
        return userDet;
    }

    @Post('editorRequest')
    async requestForEditor(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const response = await this.userService.requestForEditor(user.userId);
        return response;
    }

    @Get('editorRequest/status')
    async getEditorRequestStatus(@Req() req: Request){
        const user = req['user'] as { userId: Types.ObjectId; role: string};
        const status = await this.userService.getEditorRequestStatus(user.userId);
        return {status};
    }
}
