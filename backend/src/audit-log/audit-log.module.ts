import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
    imports: [PrismaModule],
    providers: [AuditLogService],
    exports: [AuditLogService],
    controllers: [AuditLogController],
})
export class AuditLogModule { }
