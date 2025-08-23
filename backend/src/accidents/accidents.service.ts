import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';

@Injectable()
export class AccidentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: number, dto: CreateAccidentDto) {
        return this.prisma.accident.create({
            data: {
                status: 'draft',
                createdBy: userId,
                parties: {
                    create: {
                        role: 'A',
                        userId: userId,
                        insured: {},
                        vehicle: {},
                        insurance: {},
                        driver: {}
                    }
                }
            }
        });
    }
}
