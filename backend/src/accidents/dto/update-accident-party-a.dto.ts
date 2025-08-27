import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class UpdateAccidentPartyADto {
    // insured
    @IsOptional() @IsString() surname?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() postalCode?: string;
    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsString() contact?: string;
    @IsOptional() @IsString() nif?: string;

    // vehicle
    @IsOptional() @IsString() brandModel?: string;
    @IsOptional() @IsString() plate?: string;
    @IsOptional() @IsString() vehicleCountry?: string;
    @IsOptional() @IsBoolean() trailer?: boolean;

    // insurance
    @IsOptional() @IsString() insuranceCompany?: string;
    @IsOptional() @IsString() insurancePolicyNum?: string;
    @IsOptional() @IsString() greenCard?: string;
    @IsOptional() @IsDateString() insuranceStart?: string;
    @IsOptional() @IsDateString() insuranceEnd?: string;

    // driver
    @IsOptional() @IsString() driverSurname?: string;
    @IsOptional() @IsString() driverName?: string;
    @IsOptional() @IsDateString() driverBirth?: string;
    @IsOptional() @IsString() driverAddress?: string;
    @IsOptional() @IsString() driverPostalCode?: string;
    @IsOptional() @IsString() driverCountry?: string;
    @IsOptional() @IsString() driverContact?: string;
    @IsOptional() @IsString() driverLicenseNum?: string;
    @IsOptional() @IsString() driverLicenseCategory?: string;
    @IsOptional() @IsDateString() driverLicenseExpiry?: string;
}
