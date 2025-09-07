import { IsNotEmpty, IsString } from 'class-validator';

export class SignAccidentDto {
    @IsString()
    @IsNotEmpty()
    signature: string;
}
