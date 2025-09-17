import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/role.decorator';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get('accident/:id')
    @Role('ADMIN')
    async findByAccident(@Param('id', ParseIntPipe) id: number) {
        return this.auditLogService.findByAccident(id);
    }

    @Get()
    @Role('ADMIN')
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('accidentId') accidentId?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        return this.auditLogService.findAll({
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            accidentId: accidentId ? Number(accidentId) : undefined,
            userId: userId ? Number(userId) : undefined,
            action,
            from,
            to
        });
    }
}
