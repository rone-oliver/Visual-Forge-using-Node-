import { Controller, Post, Body, UseGuards, Get, Param, Inject } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/community.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ICommunityService, ICommunityServiceToken } from './interfaces/community.service.interface';
import { CreateCommunityMessageDto } from './dto/community.dto';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Community')
@ApiBearerAuth()
@Controller('editor/community')
@UseGuards(AuthGuard, RolesGuard)
export class CommunityController {
  constructor(
    @Inject(ICommunityServiceToken) private readonly communityService: ICommunityService,
  ) {}

  @Post()
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Create a new community' })
  @ApiResponse({ status: 201, description: 'The community has been successfully created.' })
  create(@Body() createCommunityDto: CreateCommunityDto, @GetUser('userId') userId: string) {
    return this.communityService.create(createCommunityDto, userId);
  }

  @Get()
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Get all communities' })
  @ApiResponse({ status: 200, description: 'Return all communities.' })
  findAll() {
    return this.communityService.findAll();
  }

  @Get(':id')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Get a community by ID' })
  @ApiResponse({ status: 200, description: 'Return the community.' })
  findById(@Param('id') id: string) {
    return this.communityService.findById(id);
  }

  @Post(':id/members')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Add a member to a community' })
  @ApiResponse({ status: 200, description: 'The member has been successfully added.' })
  addMember(@Param('id') communityId: string, @Body('userId') userId: string) {
    return this.communityService.addMember(communityId, userId);
  }

  @Get(':id/messages')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Get all messages for a community' })
  @ApiResponse({ status: 200, description: 'Return all messages for the community.' })
  getMessages(@Param('id') communityId: string) {
    return this.communityService.getMessages(communityId);
  }

  @Post(':id/messages')
  @Roles(Role.EDITOR, Role.USER)
  @ApiOperation({ summary: 'Send a message to a community' })
  @ApiResponse({ status: 201, description: 'The message has been successfully sent.' })
  sendMessage(
    @Param('id') communityId: string, 
    @GetUser('userId') userId: string, 
    @Body() createCommunityMessageDto: CreateCommunityMessageDto
  ) {
    return this.communityService.sendMessage(communityId, userId, createCommunityMessageDto.content);
  }
}