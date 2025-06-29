import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Admin } from 'src/admins/models/admin.schema';

export class AdminLoginDto {
    @ApiProperty({
        description: 'The username for admin login',
        example: 'admin_user',
        minLength: 5,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    username: string;

    @ApiProperty({
        description: 'The password for admin login',
        example: 'StrongP@ssw0rd',
        minLength: 8,
        format: 'password',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

export class AdminLoginResponseDto {
    @ApiProperty({ type: Admin})
    admin: Admin;

    @ApiProperty({
        type: 'string',
        format: 'jwt',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    })
    accessToken: string;
}