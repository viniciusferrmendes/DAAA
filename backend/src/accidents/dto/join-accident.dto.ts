import { IsString } from 'class-validator';

export class JoinAccidentDto {
    @IsString()
    token: string;
}
