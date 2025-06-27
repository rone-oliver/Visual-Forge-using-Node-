import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { NotificationType } from '../models/notification.schema';

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsIn(Object.values(NotificationType))
    type: NotificationType;

    @IsOptional()
    data?: any;

    @IsOptional()
    @IsString()
    quotationId?: string;

    @IsOptional()
    @IsString()
    worksId?: string;
}