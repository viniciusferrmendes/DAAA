import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { randomBytes } from 'crypto';
import { UpdateAccidentPartyDto } from './dto/update-accident-party.dto';
import { UpdateAccidentGeneralDto } from './dto/update-accident-general.dto';
import { UpdateCircumstancesDto } from './dto/update-circumstances.dto';
import { UpdateCollisionPointDto } from './dto/update-collision-point.dto';
import { UpdateWitnessesDto } from './dto/update-witnesses.dto';
import { Prisma } from '@prisma/client';
import { UpdateObservationsDto } from './dto/update-observations.dto';

@Injectable()
export class AccidentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: number, dto: any) {
        return this.prisma.accident.create({
            data: {
                createdBy: userId,
                status: 'draft',
                parties: {
                    create: {
                        role: 'A',
                        userId,
                    },
                },
            },
            include: {
                parties: true
            },
        });
    }

    async createQrSession(userId: number, accidentId: number) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const partyA = accident.parties.find(p => p.role === 'A');
        if (!partyA || partyA.userId !== userId) {
            throw new ForbiddenException('Only Party A can generate QR');
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        return this.prisma.qrSession.create({
            data: {
                accidentId,
                token,
                expiresAt,
                used: false,
            },
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

    async updateGeneral(userId: number, accidentId: number, dto: UpdateAccidentGeneralDto) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const party = await this.prisma.accidentParty.findFirst({
            where: { accidentId, userId },
        });
        if (!party && accident.createdBy !== userId) {
            throw new ForbiddenException('You are not allowed to edit this accident');
        }

        return this.prisma.accident.update({
            where: { id: accidentId },
            data: {
                ...dto,
                dateTime: dto.dateTime ? new Date(dto.dateTime) : accident.dateTime,
            },
        });
    }

    async updateParty(userId: number, accidentId: number, role: 'A' | 'B', dto: UpdateAccidentPartyDto) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find(p => p.role === role);
        if (!party) throw new NotFoundException(`Party ${role} not found`);

        if (party.userId !== userId) {
            throw new ForbiddenException(`You are not allowed to update Party ${role}`);
        }

        let vehicleData: any = party.vehicle || {};
        let insuranceData: any = party.insurance || {};

        if (dto.vehicleId) {
            const vehicle = await this.prisma.vehicle.findFirst({
                where: { id: dto.vehicleId, userId },
            });
            if (!vehicle) throw new ForbiddenException('Vehicle does not belong to you');

            vehicleData = {
                plate: vehicle.plate,
                brandModel: `${vehicle.brand} ${vehicle.model}`,
                country: vehicle.country,
                trailer: false, // default
            };

            insuranceData = {
                insuranceCompany: vehicle.insuranceCompany,
                insurancePolicyNum: vehicle.insurancePolicyNum,
                insuranceStart: vehicle.insuranceStart,
                insuranceEnd: vehicle.insuranceEnd,
            };
        } else {
            if (dto.vehicle) {
                vehicleData = { ...vehicleData, ...dto.vehicle };
            }
            if (dto.insurance) {
                insuranceData = { ...insuranceData, ...dto.insurance };
            }
        }

        return this.prisma.accidentParty.update({
            where: { id: party.id },
            data: {
                insured: dto.insured
                    ? { ...(party.insured as any), ...dto.insured }
                    : party.insured,

                vehicle: vehicleData,
                insurance: insuranceData,

                driver: dto.driver
                    ? { ...(party.driver as any), ...dto.driver }
                    : party.driver,
            },
        });
    }

    async updateCircumstances(accidentId: number, userId: number, dto: UpdateCircumstancesDto,) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const current = (accident.circumstances ?? {}) as Record<string, any>;

        let newCircumstances = { ...current };

        if (party.role === 'A' && dto.vehicleA) {
            newCircumstances.vehicleA = dto.vehicleA;
        } else if (party.role === 'B' && dto.vehicleB) {
            newCircumstances.vehicleB = dto.vehicleB;
        } else {
            throw new ForbiddenException('You can only update your own circumstances');
        }

        return this.prisma.accident.update({
            where: { id: accidentId },
            data: { circumstances: newCircumstances },
        });
    }

    async updateCollisionPoint(
        accidentId: number,
        userId: number,
        dto: UpdateCollisionPointDto,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const current = (accident.collisionPoint ?? {}) as Record<string, any>;
        let newCollisionPoint = { ...current };

        if (party.role === 'A' && dto.vehicleA) {
            newCollisionPoint.vehicleA = dto.vehicleA;
        } else if (party.role === 'B' && dto.vehicleB) {
            newCollisionPoint.vehicleB = dto.vehicleB;
        } else {
            throw new ForbiddenException('You can only update your own collision point');
        }

        return this.prisma.accident.update({
            where: { id: accidentId },
            data: { collisionPoint: newCollisionPoint },
        });
    }

    async updateWitnesses(
        accidentId: number,
        userId: number,
        dto: UpdateWitnessesDto,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
        });
        if (!accident) {
            throw new NotFoundException('Accident not found');
        }

        const party = await this.prisma.accidentParty.findFirst({
            where: { accidentId, userId },
        });
        if (!party) {
            throw new ForbiddenException('You are not part of this accident');
        }

        return this.prisma.accident.update({
            where: { id: accidentId },
            data: {
                witnesses: dto.witnesses as unknown as Prisma.InputJsonValue
            }
        });
    }

    async updateObservations(
        accidentId: number,
        userId: number,
        dto: UpdateObservationsDto,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find(p => p.userId === userId);
        if (!party) throw new ForbiddenException('Not part of this accident');

        let newObservations: any = accident.observations ?? {};
        if (party.role === 'A' && dto.vehicleA) {
            newObservations.vehicleA = dto.vehicleA;
        }
        if (party.role === 'B' && dto.vehicleB) {
            newObservations.vehicleB = dto.vehicleB;
        }

        return this.prisma.accident.update({
            where: { id: accidentId },
            data: {
                observations: newObservations,
                updatedAt: new Date(),
            },
        });
    }
}
