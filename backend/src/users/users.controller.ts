import { Controller, Get, Req } from '@nestjs/common';
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
        console.log('user profile response: ', userDet);
        return userDet;
    }
}
