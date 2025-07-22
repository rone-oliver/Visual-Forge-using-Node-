import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { INotificationRepository } from '../interfaces/notification-repository.interface';
import {
  Notification,
  NotificationDocument,
} from '../models/notification.schema';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly _notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { userId, quotationId, worksId, ...rest } = createNotificationDto;

    const notificationData: any = {
      ...rest,
      userId: new Types.ObjectId(userId),
    };

    if (quotationId) {
      notificationData.quotationId = new Types.ObjectId(quotationId);
    }

    if (worksId) {
      notificationData.worksId = new Types.ObjectId(worksId);
    }

    return this._notificationModel.create(notificationData);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this._notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this._notificationModel
      .find({ userId: new Types.ObjectId(userId), unread: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Notification | null> {
    return this._notificationModel.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<Notification>,
  ): Promise<Notification | null> {
    return this._notificationModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async updateMany(
    filter: { userId: string; unread: boolean },
    data: Partial<Notification>,
  ): Promise<any> {
    return this._notificationModel
      .updateMany(
        { userId: new Types.ObjectId(filter.userId), unread: filter.unread },
        data,
        { new: true },
      )
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this._notificationModel.findByIdAndDelete(id).exec();
  }

  async countUnread(userId: string): Promise<number> {
    return this._notificationModel
      .countDocuments({ userId: new Types.ObjectId(userId), unread: true })
      .exec();
  }
}
