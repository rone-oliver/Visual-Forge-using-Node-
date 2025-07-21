import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';
import { RelationshipType } from 'src/common/enums/relationships.enum';

export class RelationshipDto {
  @IsMongoId()
  sourceUser: Types.ObjectId;

  @IsMongoId()
  targetUser: Types.ObjectId;

  @IsEnum(RelationshipType)
  type: RelationshipType;
}

export class PaginatedRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip: number = 0;
}

export class GetRelatedUsersDto extends PaginatedRequestDto {
  @IsMongoId()
  userId: Types.ObjectId;
}
