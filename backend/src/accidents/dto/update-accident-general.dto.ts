import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccidentGeneralDto {
    @IsOptional()
    @IsDateString()
    dateTime?: string;

    @IsOptional()
    @IsString()
    time?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsNumber()
    geoLat?: number;

    @IsOptional()
    @IsNumber()
    geoLng?: number;

    @IsOptional()
    @IsBoolean()
    injuries?: boolean;

    @IsOptional()
    materialDamages?: any;
}
