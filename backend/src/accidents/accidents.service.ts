import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    async createQrSession(userId: number, accidentId: number) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
        });

        if (!accident) {
            throw new NotFoundException('Accident not found');
        }

        if (accident.createdBy !== userId) {
            throw new ForbiddenException('Only Party A can generate QR sessions');
        }

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
            where: { token },
            include: { accident: { include: { parties: true } } },
        });

        if (!session || session.used || session.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired token');
        }

        const accident = session.accident;

        if (!accident) {
            throw new NotFoundException('Accident not found');
        }

        const hasPartyB = accident.parties.some(p => p.role === 'B');
        if (hasPartyB) {
            throw new BadRequestException('Accident already has Party B');
        }

        const isAlreadyParticipant = accident.parties.some(p => p.userId === userId);
        if (isAlreadyParticipant) {
            throw new BadRequestException('User is already part of this accident');
        }

        await this.prisma.qrSession.update({
            where: { id: session.id },
            data: { used: true },
        });

        return this.prisma.accidentParty.create({
            data: {
                accidentId: accident.id,
                role: 'B',
                userId,
            },
        });
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
