import { Body, Controller, Get, Inject, Logger, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { Types } from 'mongoose';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/users/models/user.schema';
import { IAdminsController } from './interfaces/admins.controller.interface';
import { FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto } from './dto/admins.controller.dto';
import { IAdminsService, IAdminsServiceToken } from './interfaces/admins.service.interface';
import { Role } from 'src/common/enums/role.enum';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminsController implements IAdminsController {
    private readonly logger = new Logger(AdminsController.name);
    constructor(
        @Inject(IAdminsServiceToken) private adminService: IAdminsService
    ) { };
    @Get('users')
    @Roles(Role.ADMIN)
    async getAllUsers(@Query() query: GetAllUsersQueryDto): Promise<User[]> {
        return await this.adminService.getAllUsers(query);
    }

    @Get('requests/editor')
    @Roles(Role.ADMIN)
    async getEditorRequests(): Promise<FormattedEditorRequest[]> {
        this.logger.log('Attempting to fetch all editor requests');
        return await this.adminService.getEditorRequests();
    }

    @Patch('requests/editor/:reqId/approve')
    @Roles(Role.ADMIN)
    async approveRequest(@Req() req: Request, @Param('reqId') reqId: string): Promise<boolean> {
        this.logger.log(`Attempting to approve editor request with ID: ${reqId} by admin ID: ${req['user'].userId}`);
        const admin = req['user'] as { userId: Types.ObjectId, role: string }
        return await this.adminService.approveRequest(new Types.ObjectId(reqId), admin.userId);
    }

    @Patch('requests/editor/:reqId/reject')
    @Roles(Role.ADMIN)
    async rejectRequest(@Param('reqId') reqId: string, @Body() body: { reason: string }): Promise<boolean> {
        this.logger.log(`Attempting to reject editor request with ID: ${reqId}`);
        return await this.adminService.rejectRequest(new Types.ObjectId(reqId), body.reason);
    }

    @Get('editors')
    @Roles(Role.ADMIN)
    async getEditors(@Query() query:GetEditorsQueryDto): Promise<FormattedEditor[]>{
        this.logger.log('Attempting to fetch editors with query:', query);
        return await this.adminService.getEditors(query);
    }

    @Patch('users/:userId/block')
    @Roles(Role.ADMIN)
    async blockUser(@Param('userId') userId: string): Promise<boolean> {
        this.logger.log(`Attempting to block user with ID: ${userId}`);
        return await this.adminService.blockUser(new Types.ObjectId(userId));
    }
}
