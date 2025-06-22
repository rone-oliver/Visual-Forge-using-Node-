import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommunityDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class CreateCommunityMessageDto {
  @ApiProperty({ description: 'The content of the message' })
  @IsNotEmpty()
  @IsString()
  content: string;
}