import { IsOptional, IsString, IsDateString, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InsuredDto {
    @IsOptional() @IsString() surname?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() postalCode?: string;
    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsString() contact?: string;
    @IsOptional() @IsString() nif?: string;
}

class VehicleDto {
    @IsOptional() @IsString() brandModel?: string;
    @IsOptional() @IsString() plate?: string;
    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsBoolean() trailer?: boolean;
}

class InsuranceDto {
    @IsOptional() @IsString() insuranceCompany?: string;
    @IsOptional() @IsString() insurancePolicyNum?: string;
    @IsOptional() @IsString() greenCard?: string;
    @IsOptional() @IsDateString() insuranceStart?: string;
    @IsOptional() @IsDateString() insuranceEnd?: string;
}

class DriverDto {
    @IsOptional() @IsString() surname?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsDateString() birth?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() postalCode?: string;
    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsString() contact?: string;
    @IsOptional() @IsString() licenseNum?: string;
    @IsOptional() @IsString() driverLicenseCategory?: string;
    @IsOptional() @IsDateString() driverLicenseExpiry?: string;
}

export class UpdateAccidentPartyDto {
    @IsOptional() @IsNumber()
    vehicleId?: number;

    @IsOptional() @ValidateNested() @Type(() => InsuredDto)
    insured?: InsuredDto;

    @IsOptional() @ValidateNested() @Type(() => VehicleDto)
    vehicle?: VehicleDto;

    @IsOptional() @ValidateNested() @Type(() => InsuranceDto)
    insurance?: InsuranceDto;

    @IsOptional() @ValidateNested() @Type(() => DriverDto)
    driver?: DriverDto;
}
