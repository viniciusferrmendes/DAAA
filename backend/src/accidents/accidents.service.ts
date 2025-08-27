import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { randomBytes } from 'crypto';
import { UpdateAccidentPartyDto } from './dto/update-accident-party.dto';

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

    async updatePartyA(userId: number, accidentId: number, dto: UpdateAccidentPartyDto) {
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

    async updatePartyB(userId: number, accidentId: number, dto: UpdateAccidentPartyDto) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });

        if (!accident) throw new NotFoundException('Accident not found');

        const partyB = accident.parties.find(p => p.role === 'B');
        if (!partyB) throw new NotFoundException('Party B not found');
        if (partyB.userId !== userId) {
            throw new ForbiddenException('You are not allowed to update Party B');
        }

        let vehicleData = (partyB.vehicle as any) || {};

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
            where: { id: partyB.id },
            data: {
                insured: {
                    ...((partyB.insured as any) || {}),
                    surname: dto.surname ?? (partyB.insured as any)?.surname,
                    name: dto.name ?? (partyB.insured as any)?.name,
                    address: dto.address ?? (partyB.insured as any)?.address,
                    postalCode: dto.postalCode ?? (partyB.insured as any)?.postalCode,
                    country: dto.country ?? (partyB.insured as any)?.country,
                    contact: dto.contact ?? (partyB.insured as any)?.contact,
                    nif: dto.nif ?? (partyB.insured as any)?.nif,
                },
                vehicle: vehicleData,
                insurance: {
                    ...((partyB.insurance as any) || {}),
                    company: dto.insuranceCompany ?? (partyB.insurance as any)?.company,
                    policyNum: dto.insurancePolicyNum ?? (partyB.insurance as any)?.policyNum,
                    greenCard: dto.greenCard ?? (partyB.insurance as any)?.greenCard,
                    start: dto.insuranceStart ?? (partyB.insurance as any)?.start,
                    end: dto.insuranceEnd ?? (partyB.insurance as any)?.end,
                },
                driver: {
                    ...((partyB.driver as any) || {}),
                    surname: dto.driverSurname ?? (partyB.driver as any)?.surname,
                    name: dto.driverName ?? (partyB.driver as any)?.name,
                    birth: dto.driverBirth ?? (partyB.driver as any)?.birth,
                    address: dto.driverAddress ?? (partyB.driver as any)?.address,
                    postalCode: dto.driverPostalCode ?? (partyB.driver as any)?.postalCode,
                    country: dto.driverCountry ?? (partyB.driver as any)?.country,
                    contact: dto.driverContact ?? (partyB.driver as any)?.contact,
                    licenseNum: dto.driverLicenseNum ?? (partyB.driver as any)?.licenseNum,
                    licenseCategory: dto.driverLicenseCategory ?? (partyB.driver as any)?.licenseCategory,
                    licenseExpiry: dto.driverLicenseExpiry ?? (partyB.driver as any)?.licenseExpiry,
                },
            },
        });
    }
}
