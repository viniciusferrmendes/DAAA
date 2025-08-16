import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
    @IsString() @MinLength(1)
    brand: string;

    @IsString() @MinLength(1)
    model: string;

    @IsString() @MinLength(1)
    plate: string;

    @IsString() @MinLength(1)
    country: string;

    @IsInt() @Min(1900)
    year: number;

    @IsInt() @Min(1)
    userId: number; // FK to User
}
