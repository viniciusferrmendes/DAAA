import { Module } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
    imports: [PrismaModule, AuditLogModule, PdfModule],
    providers: [AccidentsService],
    controllers: [AccidentsController],
})

export class AccidentsModule { }
