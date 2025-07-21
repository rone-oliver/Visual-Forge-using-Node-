import { FilterQuery, UpdateQuery } from 'mongoose';
import { Otp } from 'src/auth/users-auth/models/otp.schema';

export const IOtpRepositoryToken = Symbol('IOtpRepository');

export interface IOtpRepository {
  upsert(filter: FilterQuery<Otp>, data: Partial<Otp>): Promise<boolean>;
  findAndUpdate(
    filter: FilterQuery<Otp>,
    update: UpdateQuery<Otp>,
  ): Promise<boolean>;
}
