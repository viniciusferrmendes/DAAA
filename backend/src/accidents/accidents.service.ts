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
                expiresAt
            }
        });
    }

    async joinAccident(userId: number, token: string) {
        const session = await this.prisma.qrSession.findUnique({
            where: { token }
        });

        if (!session || session.used || session.expiresAt < new Date()) {
            throw new Error('Invalid or expired token');
        }

        const accident = await this.prisma.accident.update({
            where: { id: session.accidentId },
            data: {
                parties: {
                    create: {
                        role: 'B',
                        userId,
                        insured: {},
                        vehicle: {},
                        insurance: {},
                        driver: {}
                    }
                }
            },
            include: { parties: true }
        });

        await this.prisma.qrSession.update({
            where: { id: session.id },
            data: { used: true }
        });

        return accident;
    }

    async findAllByUser(userId: number) {
        return this.prisma.accident.findMany({
            where: {
                parties: {
                    some: { userId }
                }
            },
            include: { parties: true }
        });
    }

    async findOneByUser(userId: number, id: number) {
        return this.prisma.accident.findFirst({
            where: {
                id,
                parties: {
                    some: { userId }
                }
            },
            include: { parties: true }
        });
    }
}
