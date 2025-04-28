import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
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

    @Get('editor-requests')
    @Roles('Admin')
    async getEditorRequests() {
        return await this.adminService.getEditorRequests();
    }

    @Patch('editor-request/approve')
    @Roles('Admin')
    async approveRequest(@Req() req: Request, @Body() body: { requestId: string }): Promise<boolean> {
        const admin = req['user'] as { userId: Types.ObjectId, role: string }
        if(admin.role !== 'Admin')return false;
        return await this.adminService.approveRequest(new Types.ObjectId(body.requestId), admin.userId);
    }

    @Patch('editor-request/reject')
    @Roles('Admin')
    async rejectRequest(@Body() body: { requestId: string, reason: string }): Promise<boolean> {
        return await this.adminService.rejectRequest(new Types.ObjectId(body.requestId), body.reason);
    }

    @Get('editors')
    @Roles('Admin')
    async getEditors(){
        return await this.adminService.getEditors();
    }

    @Patch('users/block')
    @Roles('Admin')
    async blockUser(@Body() body: { userId: string }): Promise<boolean> {
        return await this.adminService.blockUser(new Types.ObjectId(body.userId));
    }
}
