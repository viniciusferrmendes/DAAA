import { IsInt, IsString, Min, MinLength, IsOptional, IsDateString } from 'class-validator';

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    brand?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    model?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    plate?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    country?: string;

    @IsOptional()
    @IsInt()
    @Min(1900)
    year?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    userId?: number;

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
