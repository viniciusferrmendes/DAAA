import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateVehicleDto) {
        // validate user exists (simple check)
        await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId } });

        return this.prisma.vehicle.create({ data: dto });
    }

    async findAll() {
        return this.prisma.vehicle.findMany({
            orderBy: { id: 'asc' },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
    }
}
