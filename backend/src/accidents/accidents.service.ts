import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { randomBytes } from 'crypto';

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

    async createQrSession(accidentId: number) {
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        return this.prisma.qrSession.create({
            data: {
                accidentId,
                token,
                expiresAt,
            },
        });
    }
}
