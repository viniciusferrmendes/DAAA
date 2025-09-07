import { IsOptional, IsString } from 'class-validator';

export class UpdateVisibleDamagesDto {
    @IsOptional()
    @IsString()
    vehicleA?: string;

    @IsOptional()
    @IsString()
    vehicleB?: string;
}
