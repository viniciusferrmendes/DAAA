import { IsOptional, IsString } from 'class-validator';

export class UpdateCollisionPointDto {
    @IsOptional()
    @IsString()
    vehicleA?: string;

    @IsOptional()
    @IsString()
    vehicleB?: string;
}
