import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, PartyRole, Prisma, } from '@prisma/client';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentPartyDto } from './dto/update-accident-party.dto';
import { UpdateAccidentGeneralDto } from './dto/update-accident-general.dto';
import { UpdateCircumstancesDto } from './dto/update-circumstances.dto';
import { UpdateCollisionPointDto } from './dto/update-collision-point.dto';
import { UpdateWitnessesDto } from './dto/update-witnesses.dto';
import { UpdateObservationsDto } from './dto/update-observations.dto';
import { SignAccidentDto } from './dto/sign-accident.dto';
import { UpdateVisibleDamagesDto } from './dto/update-visible-damages.dto';
import { UpdateSketchDto } from './dto/update-sketch.dto';
import * as crypto from 'crypto';

@Injectable()
export class AccidentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLogService: AuditLogService,
    ) { }

    async create(userId: number, dto: CreateAccidentDto, ip?: string) {
        const accident = await this.prisma.accident.create({
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
            include: { parties: true },
        });

        await this.auditLogService.logAction({
            accidentId: accident.id,
            userId,
            party: PartyRole.A,
            action: AuditAction.CREATE_ACCIDENT,
            ip,
        });

        return accident;
    }

    async createQrSession(userId: number, accidentId: number, ip?: string) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const partyA = accident.parties.find((p) => p.role === 'A');
        if (!partyA || partyA.userId !== userId) {
            throw new ForbiddenException('Only Party A can generate QR');
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const session = await this.prisma.qrSession.create({
            data: { accidentId, token, expiresAt, used: false },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: PartyRole.A,
            action: AuditAction.UPDATE_GENERAL,
            ip,
        });

        return session;
    }

    async joinAccident(userId: number, token: string, ip?: string) {
        const session = await this.prisma.qrSession.findUnique({
            where: { token },
            include: { accident: { include: { parties: true } } },
        });
        if (!session || session.used || session.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired token');
        }

        const accident = session.accident;
        if (!accident) throw new NotFoundException('Accident not found');

        const hasPartyB = accident.parties.some((p) => p.role === 'B');
        if (hasPartyB) throw new BadRequestException('Accident already has Party B');

        const isAlreadyParticipant = accident.parties.some((p) => p.userId === userId);
        if (isAlreadyParticipant) {
            throw new BadRequestException('User is already part of this accident');
        }

        await this.prisma.qrSession.update({
            where: { id: session.id },
            data: { used: true },
        });

        const partyB = await this.prisma.accidentParty.create({
            data: { accidentId: accident.id, role: 'B', userId },
        });

        await this.auditLogService.logAction({
            accidentId: accident.id,
            userId,
            party: PartyRole.B,
            action: AuditAction.UPDATE_PARTYB,
            ip,
        });

        return partyB;
    }

    async updateGeneral(
        userId: number,
        accidentId: number,
        dto: UpdateAccidentGeneralDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = await this.prisma.accidentParty.findFirst({
            where: { accidentId, userId },
        });
        if (!party && accident.createdBy !== userId) {
            throw new ForbiddenException('Not allowed to edit this accident');
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: {
                ...dto,
                dateTime: dto.dateTime ? new Date(dto.dateTime) : accident.dateTime,
            },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party?.role,
            action: AuditAction.UPDATE_GENERAL,
            ip,
        });

        return updated;
    }

    async updateParty(
        userId: number,
        accidentId: number,
        role: 'A' | 'B',
        dto: UpdateAccidentPartyDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.role === role);
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
                trailer: false,
            };

            insuranceData = {
                insuranceCompany: vehicle.insuranceCompany,
                insurancePolicyNum: vehicle.insurancePolicyNum,
                insuranceStart: vehicle.insuranceStart,
                insuranceEnd: vehicle.insuranceEnd,
            };
        } else {
            if (dto.vehicle) vehicleData = { ...vehicleData, ...dto.vehicle };
            if (dto.insurance) insuranceData = { ...insuranceData, ...dto.insurance };
        }

        const updated = await this.prisma.accidentParty.update({
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

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: role as PartyRole,
            action: role === 'A'
                ? AuditAction.UPDATE_PARTYA
                : AuditAction.UPDATE_PARTYB,
            ip,
        });

        return updated;
    }

    async updateCircumstances(
        accidentId: number,
        userId: number,
        dto: UpdateCircumstancesDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const current = (accident.circumstances ?? {}) as Record<string, any>;
        const newCircumstances = { ...current };

        if (party.role === 'A' && dto.vehicleA) {
            newCircumstances.vehicleA = dto.vehicleA;
        } else if (party.role === 'B' && dto.vehicleB) {
            newCircumstances.vehicleB = dto.vehicleB;
        } else {
            throw new ForbiddenException('You can only update your own circumstances');
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: { circumstances: newCircumstances },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_CIRCUMSTANCES,
            ip,
        });

        return updated;
    }

    async updateCollisionPoint(
        accidentId: number,
        userId: number,
        dto: UpdateCollisionPointDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const current = (accident.collisionPoint ?? {}) as Record<string, any>;
        const newCollisionPoint = { ...current };

        if (party.role === 'A' && dto.vehicleA) {
            newCollisionPoint.vehicleA = dto.vehicleA;
        } else if (party.role === 'B' && dto.vehicleB) {
            newCollisionPoint.vehicleB = dto.vehicleB;
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: { collisionPoint: newCollisionPoint },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_COLLISION_POINT,
            ip,
        });

        return updated;
    }

    async updateWitnesses(
        accidentId: number,
        userId: number,
        dto: UpdateWitnessesDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = await this.prisma.accidentParty.findFirst({
            where: { accidentId, userId },
        });
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const updateData: Prisma.AccidentUpdateInput = {};
        if (party.role === 'A') {
            updateData.witnessesA = dto.witnesses as any;
        } else if (party.role === 'B') {
            updateData.witnessesB = dto.witnesses as any;
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: updateData,
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_WITNESSES,
            ip,
        });

        return updated;
    }

    async updateObservations(
        accidentId: number,
        userId: number,
        dto: UpdateObservationsDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('Not part of this accident');

        let newObservations: any = accident.observations ?? {};
        if (party.role === 'A' && dto.vehicleA) {
            newObservations.vehicleA = dto.vehicleA;
        }
        if (party.role === 'B' && dto.vehicleB) {
            newObservations.vehicleB = dto.vehicleB;
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: { observations: newObservations, updatedAt: new Date() },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_OBSERVATIONS,
            ip,
        });

        return updated;
    }

    async updateSketch(
        accidentId: number,
        userId: number,
        dto: UpdateSketchDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: { sketchUrl: dto.sketchUrl },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_SKETCH,
            ip,
        });

        return updated;
    }

    async updateVisibleDamages(
        accidentId: number,
        userId: number,
        dto: UpdateVisibleDamagesDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const currentDamages = (accident.visibleDamages as any) || {};
        const data: any = {};

        if (party.role === 'A') {
            data.visibleDamages = {
                ...currentDamages,
                vehicleA: dto.vehicleA ?? currentDamages.vehicleA,
            };
        } else {
            data.visibleDamages = {
                ...currentDamages,
                vehicleB: dto.vehicleB ?? currentDamages.vehicleB,
            };
        }

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data,
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: AuditAction.UPDATE_VISIBLE_DAMAGES,
            ip,
        });

        return updated;
    }

    async signAccident(
        accidentId: number,
        userId: number,
        dto: SignAccidentDto,
        ip?: string,
    ) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: { parties: true },
        });
        if (!accident) throw new NotFoundException('Accident not found');

        const party = accident.parties.find((p) => p.userId === userId);
        if (!party) throw new ForbiddenException('You are not part of this accident');

        const currentSignatures = (accident.signatures as any) || {};
        const newSignatures: any = { ...currentSignatures };

        if (party.role === 'A') {
            newSignatures.vehicleA = dto.signature;
        } else {
            newSignatures.vehicleB = dto.signature;
        }

        let newStatus = accident.status;
        if (['draft', 'awaiting_other_party', 'both_in_draft'].includes(newStatus)) {
            newStatus = 'ready_to_sign';
        }
        if (newStatus === 'ready_to_sign') newStatus = 'signed_by_one';
        else if (newStatus === 'signed_by_one') newStatus = 'signed_by_both';

        const updated = await this.prisma.accident.update({
            where: { id: accidentId },
            data: { signatures: newSignatures, status: newStatus },
        });

        await this.auditLogService.logAction({
            accidentId,
            userId,
            party: party.role,
            action: party.role === 'A'
                ? AuditAction.SIGN_PARTYA
                : AuditAction.SIGN_PARTYB,
            ip,
        });

        return updated;
    }

    async findAllByUser(userId: number) {
        return this.prisma.accident.findMany({
            where: {
                parties: {
                    some: { userId },
                },
            },
            include: { parties: true },
        });
    }

    async findOneByUser(userId: number, id: number) {
        return this.prisma.accident.findFirst({
            where: {
                id,
                parties: {
                    some: { userId },
                },
            },
            include: { parties: true },
        });
    }

}
