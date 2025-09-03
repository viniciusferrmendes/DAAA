import { IsOptional, IsString } from 'class-validator';

export class UpdateObservationsDto {
    @IsOptional()
    @IsString()
    vehicleA?: string;

    @IsOptional()
    @IsString()
    vehicleB?: string;
}
