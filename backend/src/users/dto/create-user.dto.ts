import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    // for now we accept a pre-hashed password (will add Auth later)
    @IsString()
    @MinLength(8)
    passwordHash: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    contact?: string;
}
