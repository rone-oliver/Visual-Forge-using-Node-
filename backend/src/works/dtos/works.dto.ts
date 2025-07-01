import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { FileType } from 'src/quotation/models/quotation.schema';

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