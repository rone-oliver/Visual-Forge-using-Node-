import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/common/database/base.repository';

import { IAdminRepository } from '../interfaces/admins.repository.interface';
import { Admin, AdminDocument } from '../models/admin.schema';

export class AdminRepository
  extends BaseRepository<Admin, AdminDocument>
  implements IAdminRepository
{
  constructor(
    @InjectModel(Admin.name) private readonly _adminModel: Model<AdminDocument>,
  ) {
    super(_adminModel);
  }
}
