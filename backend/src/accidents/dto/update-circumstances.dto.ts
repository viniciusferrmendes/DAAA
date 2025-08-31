import { IsArray, IsOptional, IsInt } from 'class-validator';

export class UpdateCircumstancesDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    vehicleA?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    vehicleB?: number[];
}