import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
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
}
