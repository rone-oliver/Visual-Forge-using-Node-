import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/models/user.schema';
import { Admin, AdminDocument } from './models/admin.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
    constructor(@InjectModel(Admin.name) private adminModel:Model<AdminDocument>){};

    async findOne(filter: Partial<Admin>): Promise<Admin | null>{
        try {
            return this.adminModel.findOne(filter).exec();
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any){
        adminData.password = await bcrypt.hash(adminData.password,10);
        return this.adminModel.create(adminData);
    }
}
