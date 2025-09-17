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

    async findAll(params: {
        skip?: number;
        take?: number;
        accidentId?: number;
        userId?: number;
        action?: string;
        from?: string;
        to?: string;
    }) {
        const { skip, take, accidentId, userId, action, from, to } = params;

        const where: any = {};
        if (accidentId) where.accidentId = accidentId;
        if (userId) where.userId = userId;
        if (action) where.action = action;

        if (from || to) {
            where.ts = {};
            if (from) where.ts.gte = new Date(from);
            if (to) where.ts.lte = new Date(to);
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                skip,
                take,
                where,
                orderBy: { ts: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            this.prisma.auditLog.count({ where })
        ]);

        const currentPage = take ? Math.floor(skip! / take) + 1 : 1;
        const totalPages = take ? Math.ceil(total / take) : 1;

        return {
            total,
            pageSize: take,
            currentPage,
            totalPages,
            data
        };
    }
}
