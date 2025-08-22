import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    passwordHash: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    contact?: string;
}
