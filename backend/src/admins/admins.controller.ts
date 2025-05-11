import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { Types } from 'mongoose';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/users/models/user.schema';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminsController {
    constructor(private adminService: AdminsService) { };
    @Get('users')
    @Roles('Admin')
    async getAllUsers(@Query() query: any): Promise<User[]> {
        return await this.adminService.getAllUsers(query);
    }

    @Get('requests/editor')
    @Roles('Admin')
    async getEditorRequests() {
        return await this.adminService.getEditorRequests();
    }

    @Patch('requests/editor/:reqId/approve')
    @Roles('Admin')
    async approveRequest(@Req() req: Request, @Param('reqId') reqId: string): Promise<boolean> {
        const admin = req['user'] as { userId: Types.ObjectId, role: string }
        return await this.adminService.approveRequest(new Types.ObjectId(reqId), admin.userId);
    }

    @Patch('requests/editor/:reqId/reject')
    @Roles('Admin')
    async rejectRequest(@Param('reqId') reqId: string, @Body() body: { reason: string }): Promise<boolean> {
        return await this.adminService.rejectRequest(new Types.ObjectId(reqId), body.reason);
    }

    @Get('editors')
    @Roles('Admin')
    async getEditors(@Query() query:any){
        return await this.adminService.getEditors(query);
    }

    @Patch('users/:userId/block')
    @Roles('Admin')
    async blockUser(@Param('userId') userId: string): Promise<boolean> {
        return await this.adminService.blockUser(new Types.ObjectId(userId));
    }
}
