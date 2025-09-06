import { IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class WitnessDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    contact?: string;
}

export class UpdateWitnessesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WitnessDto)
    witnesses: WitnessDto[];
}