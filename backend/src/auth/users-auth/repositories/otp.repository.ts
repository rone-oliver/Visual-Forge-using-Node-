import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Otp, OtpDocument } from 'src/auth/users-auth/models/otp.schema';

import { IOtpRepository } from '../interfaces/otp.repository.interface';

@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(
    @InjectModel(Otp.name) private readonly _otpModel: Model<OtpDocument>,
  ) {}

  async upsert(filter: FilterQuery<Otp>, data: Partial<Otp>): Promise<boolean> {
    const result = await this._otpModel.updateOne(
      filter,
      { $set: data },
      { upsert: true },
    );
    return result.acknowledged;
  }

  async findAndUpdate(
    filter: FilterQuery<Otp>,
    update: UpdateQuery<Otp>,
  ): Promise<boolean> {
    const result = await this._otpModel.updateOne(filter, update);
    return result.modifiedCount > 0;
  }
}
