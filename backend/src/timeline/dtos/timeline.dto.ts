import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

import { TimelineEvent } from '../models/timeline.schema';

export class CreateTimelineDto {
  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value;
  })
  quotationId: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value;
  })
  userId: Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => {
    if (value && typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value;
  })
  editorId?: Types.ObjectId;

  @IsEnum(TimelineEvent)
  @IsNotEmpty()
  event: TimelineEvent;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TimelineResponseDto {
  @ApiProperty({ enum: TimelineEvent })
  @IsEnum(TimelineEvent)
  @IsNotEmpty()
  event: TimelineEvent;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  @IsDate()
  timestamp: Date;
}
