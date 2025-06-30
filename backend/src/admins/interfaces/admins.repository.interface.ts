import { Admin } from "../models/admin.schema";

export const IAdminRepositoryToken = Symbol('IAdminRepository');

export interface IAdminRepository {
    findOne(filter: Partial<Admin>): Promise<Admin | null>;
    create(adminData: Admin): Promise<Admin>;
}