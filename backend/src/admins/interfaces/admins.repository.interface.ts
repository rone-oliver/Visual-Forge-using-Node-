import { IBaseRepository } from "src/common/interfaces/base-repository.interface";
import { Admin, AdminDocument } from "../models/admin.schema";

export const IAdminRepositoryToken = Symbol('IAdminRepository');

export interface IAdminRepository extends IBaseRepository<Admin, AdminDocument> {
    // findOne(filter: Partial<Admin>): Promise<AdminDocument | null>;
    // create(adminData: Admin): Promise<AdminDocument>;
}