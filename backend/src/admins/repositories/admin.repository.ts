import { InjectModel } from "@nestjs/mongoose";
import { IAdminRepository } from "../interfaces/admins.repository.interface";
import { Admin, AdminDocument } from "../models/admin.schema";
import { Model } from "mongoose";
import { BaseRepository } from "src/common/database/base.repository";

export class AdminRepository extends BaseRepository<Admin, AdminDocument> implements IAdminRepository {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    ) {
        super(adminModel);
    };
}