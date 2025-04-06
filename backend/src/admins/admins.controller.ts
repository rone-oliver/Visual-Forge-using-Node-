import { Controller, Get } from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admin')
export class AdminsController {
    constructor(private adminService: AdminsService){};
    @Get('users')
    async getAllUsers(){
        return await this.adminService.getAllUsers();
    }
}
