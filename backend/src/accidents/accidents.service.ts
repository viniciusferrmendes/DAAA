import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { randomBytes } from 'crypto';
import { UpdateAccidentPartyADto } from './dto/update-accident-party-a.dto';

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

    async updatePartyA(userId: number, accidentId: number, dto: UpdateAccidentPartyADto) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const partyA = accident.parties.find(p => p.role === 'A');
        if (!partyA) throw new NotFoundException('Party A not found');
        if (partyA.userId !== userId) {
            throw new ForbiddenException('You are not allowed to update Party A');
        }

        let vehicleData = (partyA.vehicle as any) || {};

        if ((dto as any).vehicleId) {
            const vehicle = await this.prisma.vehicle.findFirst({
                where: { id: (dto as any).vehicleId, userId },
            });
            if (!vehicle) {
                throw new ForbiddenException('Vehicle does not belong to you');
            }
            vehicleData = {
                id: vehicle.id,
                brandModel: vehicle.brand + ' ' + vehicle.model,
                plate: vehicle.plate,
                country: vehicle.country,
                year: vehicle.year,
                insuranceCompany: vehicle.insuranceCompany,
                insurancePolicyNum: vehicle.insurancePolicyNum,
                insuranceStart: vehicle.insuranceStart,
                insuranceEnd: vehicle.insuranceEnd,
            };
        } else {
            vehicleData = {
                ...vehicleData,
                brandModel: dto.brandModel ?? vehicleData.brandModel,
                plate: dto.plate ?? vehicleData.plate,
                country: dto.vehicleCountry ?? vehicleData.country,
                trailer: dto.trailer ?? vehicleData.trailer,
            };
        }

        return this.prisma.accidentParty.update({
            where: { id: partyA.id },
            data: {
                insured: {
                    ...((partyA.insured as any) || {}),
                    surname: dto.surname ?? (partyA.insured as any)?.surname,
                    name: dto.name ?? (partyA.insured as any)?.name,
                    address: dto.address ?? (partyA.insured as any)?.address,
                    postalCode: dto.postalCode ?? (partyA.insured as any)?.postalCode,
                    country: dto.country ?? (partyA.insured as any)?.country,
                    contact: dto.contact ?? (partyA.insured as any)?.contact,
                    nif: dto.nif ?? (partyA.insured as any)?.nif,
                },
                vehicle: vehicleData,
                insurance: {
                    ...((partyA.insurance as any) || {}),
                    company: dto.insuranceCompany ?? (partyA.insurance as any)?.company,
                    policyNum: dto.insurancePolicyNum ?? (partyA.insurance as any)?.policyNum,
                    greenCard: dto.greenCard ?? (partyA.insurance as any)?.greenCard,
                    start: dto.insuranceStart ?? (partyA.insurance as any)?.start,
                    end: dto.insuranceEnd ?? (partyA.insurance as any)?.end,
                },
                driver: {
                    ...((partyA.driver as any) || {}),
                    surname: dto.driverSurname ?? (partyA.driver as any)?.surname,
                    name: dto.driverName ?? (partyA.driver as any)?.name,
                    birth: dto.driverBirth ?? (partyA.driver as any)?.birth,
                    address: dto.driverAddress ?? (partyA.driver as any)?.address,
                    postalCode: dto.driverPostalCode ?? (partyA.driver as any)?.postalCode,
                    country: dto.driverCountry ?? (partyA.driver as any)?.country,
                    contact: dto.driverContact ?? (partyA.driver as any)?.contact,
                    licenseNum: dto.driverLicenseNum ?? (partyA.driver as any)?.licenseNum,
                    licenseCategory: dto.driverLicenseCategory ?? (partyA.driver as any)?.licenseCategory,
                    licenseExpiry: dto.driverLicenseExpiry ?? (partyA.driver as any)?.licenseExpiry,
                },
            },
        });
    }
}
