import { IsInt, IsString, Min, MinLength, IsOptional, IsDateString } from 'class-validator';

export class CreateVehicleDto {
    @IsString()
    @MinLength(1)
    brand: string;

    @IsString()
    @MinLength(1)
    model: string;

    @IsString()
    @MinLength(1)
    plate: string;

    @IsString()
    @MinLength(1)
    country: string;

    @IsInt()
    @Min(1900)
    year: number;

    @IsInt()
    @Min(1)
    userId: number;

    @IsOptional()
    @IsString()
    insuranceCompany?: string;

    @IsOptional()
    @IsString()
    insurancePolicyNum?: string;

    @IsOptional()
    @IsDateString()
    insuranceStart?: string;

    @IsOptional()
    @IsDateString()
    insuranceEnd?: string;
}
