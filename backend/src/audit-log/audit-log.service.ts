import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, PartyRole } from '@prisma/client';

@Injectable()
export class AuditLogService {
    constructor(private readonly prisma: PrismaService) { }

    async logAction(params: {
        accidentId: number;
        userId: number;
        party?: PartyRole;
        action: AuditAction;
        ip?: string;
        geoLat?: number;
        geoLng?: number;
    }) {
        return this.prisma.auditLog.create({
            data: {
                accidentId: params.accidentId,
                userId: params.userId,
                party: params.party,
                action: params.action,
                ip: params.ip,
                geoLat: params.geoLat,
                geoLng: params.geoLng,
            },
        });
    }

    async findByAccident(accidentId: number) {
        return this.prisma.auditLog.findMany({
            where: { accidentId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { ts: 'desc' },
        });
    }
}
