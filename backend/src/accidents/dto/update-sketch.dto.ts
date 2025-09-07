import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSketchDto {
    @IsString()
    @IsNotEmpty()
    sketchUrl: string;
}
