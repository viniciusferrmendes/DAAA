import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string; // plain password (we'll hash)

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    contact?: string;
}
