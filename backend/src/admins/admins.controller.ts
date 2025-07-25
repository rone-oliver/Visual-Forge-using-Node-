import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { UpdateReportDto } from 'src/reports/dtos/reports.dto';
import { Report } from 'src/reports/models/report.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { User } from 'src/users/models/user.schema';

import {
  DashboardResponseDto,
  FormattedEditor,
  FormattedEditorRequest,
  GetAllUsersQueryDto,
  GetEditorsQueryDto,
} from './dto/admin.dto';
import { IAdminsController } from './interfaces/admins.controller.interface';
import {
  IAdminsService,
  IAdminsServiceToken,
} from './interfaces/admins.service.interface';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminsController implements IAdminsController {
  private readonly _logger = new Logger(AdminsController.name);
  constructor(
    @Inject(IAdminsServiceToken) private _adminService: IAdminsService,
  ) {}
  @Get('users')
  @Roles(Role.ADMIN)
  async getAllUsers(
    @Query() query: GetAllUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    return await this._adminService.getAllUsers(query);
  }

  @Get('requests/editor')
  @Roles(Role.ADMIN)
  async getEditorRequests(): Promise<FormattedEditorRequest[]> {
    this._logger.log('Attempting to fetch all editor requests');
    return await this._adminService.getEditorRequests();
  }

  @Patch('requests/editor/:reqId/approve')
  @Roles(Role.ADMIN)
  async approveRequest(
    @Req() req: Request,
    @Param('reqId') reqId: string,
  ): Promise<boolean> {
    this._logger.log(
      `Attempting to approve editor request with ID: ${reqId} by admin ID: ${req['user'].userId}`,
    );
    const admin = req['user'] as { userId: Types.ObjectId; role: string };
    return await this._adminService.approveRequest(
      new Types.ObjectId(reqId),
      admin.userId,
    );
  }

  @Patch('requests/editor/:reqId/reject')
  @Roles(Role.ADMIN)
  async rejectRequest(
    @Param('reqId') reqId: string,
    @Body() body: { reason: string },
  ): Promise<boolean> {
    this._logger.log(`Attempting to reject editor request with ID: ${reqId}`);
    return await this._adminService.rejectRequest(
      new Types.ObjectId(reqId),
      body.reason,
    );
  }

  @Get('editors')
  @Roles(Role.ADMIN)
  async getEditors(
    @Query() query: GetEditorsQueryDto,
  ): Promise<{ editors: FormattedEditor[]; total: number }> {
    this._logger.log('Delegating to EditorsService to fetch editors');
    return await this._adminService.getEditors(query);
  }

  @Patch('users/:userId/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({
    status: 200,
    description: 'User blocked successfully.',
    type: SuccessResponseDto,
  })
  @Roles(Role.ADMIN)
  async blockUser(
    @Param('userId') userId: string,
  ): Promise<SuccessResponseDto> {
    this._logger.log(`Attempting to block user with ID: ${userId}`);
    return await this._adminService.blockUser(new Types.ObjectId(userId));
  }

  @Get('reports/pending')
  @ApiOperation({ summary: 'Get all pending reports' })
  @ApiResponse({
    status: 200,
    description: 'A list of pending reports.',
    type: [Report],
  })
  @Roles(Role.ADMIN)
  async getPendingReports(): Promise<Report[]> {
    return await this._adminService.getPendingReports();
  }

  @Patch('reports/:reportId')
  @ApiOperation({ summary: 'Update a report status and resolution' })
  @ApiResponse({
    status: 200,
    description: 'The updated report.',
    type: Report,
  })
  @Roles(Role.ADMIN)
  async updateReport(
    @Param('reportId') reportId: string,
    @Body() updateDto: UpdateReportDto,
  ): Promise<Report> {
    return await this._adminService.updateReport(reportId, updateDto);
  }

  @Get('dashboard')
  @Roles(Role.ADMIN)
  async getDashboardData(): Promise<DashboardResponseDto> {
    this._logger.log('Attempting to fetch dashboard data');
    return await this._adminService.getDashboardData();
  }
}
