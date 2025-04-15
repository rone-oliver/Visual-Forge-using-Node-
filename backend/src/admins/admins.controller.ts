import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { Types } from 'mongoose';

@Controller('admin')
export class AdminsController {
    constructor(private adminService: AdminsService) { };
    @Get('users')
    async getAllUsers() {
        return await this.adminService.getAllUsers();
    }

    @Get('editor-requests')
    async getEditorRequests() {
        return await this.adminService.getEditorRequests();
    }

    @Patch('editor-request/approve')
    async approveRequest(@Req() req: Request, @Body() body: { requestId: string }): Promise<boolean> {
        const admin = req['user'] as { userId: Types.ObjectId, role: string }
        if(admin.role !== 'Admin')return false;
        return await this.adminService.approveRequest(new Types.ObjectId(body.requestId), admin.userId);
    }

    @Patch('editor-request/reject')
    async rejectRequest(@Body() body: { requestId: string, reason: string }): Promise<boolean> {
        return await this.adminService.rejectRequest(new Types.ObjectId(body.requestId), body.reason);
    }

    @Get('editors')
    async getEditors(){
        return await this.adminService.getEditors();
    }
}
