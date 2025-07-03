import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { FileType } from 'src/quotation/models/quotation.schema';
import { FileUploadResultDto, UserBasicInfoDto } from 'src/users/dto/users.dto';
import { Works } from '../models/works.schema';

export class WorkFileAttachmentDto {
    @ApiProperty({ description: 'URL of the uploaded file' })
    @IsUrl()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ enum: FileType, description: 'Type of the file' })
    @IsEnum(FileType)
    @IsNotEmpty()
    fileType: FileType;

    @ApiProperty({ description: 'Original name of the file' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiPropertyOptional({ description: 'Size of the file in bytes' })
    @IsNumber()
    @IsOptional()
    size?: number;

    @ApiPropertyOptional({ description: 'MIME type of the file' })
    @IsString()
    @IsOptional()
    mimeType?: string;

    @ApiProperty({ description: 'Timestamp of when the file was uploaded' })
    @IsDate()
    @Type(() => Date)
    uploadedAt: Date;
}

export class CreateWorkDto {
    @IsMongoId()
    editorId: Types.ObjectId;

    @IsMongoId()
    userId: Types.ObjectId;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkFileAttachmentDto)
    finalFiles: WorkFileAttachmentDto[];

    @IsString()
    comments: string;
}

export class RateWorkDto {
    @ApiProperty({ description: 'Rating for the work (1-5)', example: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ description: 'Feedback for the work', example: 'Excellent work!' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    feedback?: string;
}

export class UpdateWorkPublicStatusDto {
    @ApiProperty({ description: 'Set the work as public or private' })
    @IsBoolean()
    isPublic: boolean;
}

export class GetPublicWorksQueryDto {
    @ApiProperty({ description: 'Page number for pagination', default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number;

    @ApiProperty({ description: 'Number of items per page', default: 10 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number;

    @ApiPropertyOptional({ description: 'Search term for filtering public works' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by rating (1-5)' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;
}

export class PublicWorkItemDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    _id: string;

    @ApiProperty({ type: () => UserBasicInfoDto, description: 'Editor who created the work' })
    @ValidateNested()
    @Type(() => UserBasicInfoDto)
    editor: UserBasicInfoDto;

    @ApiProperty({ type: () => UserBasicInfoDto, description: 'Client for whom the work was done' })
    @ValidateNested()
    @Type(() => UserBasicInfoDto)
    user: UserBasicInfoDto;

    @ApiProperty({ type: [FileUploadResultDto], description: 'Final files delivered for the work' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileUploadResultDto)
    finalFiles: FileUploadResultDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comments?: string;

    @ApiProperty()
    @IsBoolean()
    isPublic: boolean;

    @ApiPropertyOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    feedback?: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

export class PaginatedPublicWorksResponseDto {
    @ApiProperty({ type: [PublicWorkItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PublicWorkItemDto)
    works: PublicWorkItemDto[];

    @ApiProperty({ description: 'Total number of public works' })
    @IsInt()
    total: number;
}

export type PopulatedUser = {
    _id: Types.ObjectId;
    fullname: string;
    username: string;
    email: string;
    profileImage?: string;
};

export type PopulatedWork = Omit<Works, 'editorId' | 'userId' | '_id'> & {
    _id: Types.ObjectId;
    editorId: PopulatedUser | null;
    userId: PopulatedUser | null;
};