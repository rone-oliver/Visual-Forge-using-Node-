import { InjectModel } from "@nestjs/mongoose";
import { IAdminRepository } from "../interfaces/admins.repository.interface";
import { Admin, AdminDocument } from "../models/admin.schema";
import { Model } from "mongoose";

export class AdminRepository implements IAdminRepository {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    ) { };

    async findOne(filter: Partial<Admin>): Promise<Admin | null> {
        return this.adminModel.findOne(filter).exec();
    }

    async create(adminData: Admin): Promise<Admin> {
        return this.adminModel.create(adminData);
    }
}