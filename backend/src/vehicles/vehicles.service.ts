import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateVehicleDto) {
        await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId } });
        return this.prisma.vehicle.create({ data: dto });
    }

    async findAll() {
        return this.prisma.vehicle.findMany({
            orderBy: { id: 'asc' },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
    }

    async update(userId: number, vehicleId: number, dto: UpdateVehicleDto) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found');
        }

        if (vehicle.userId !== userId) {
            throw new ForbiddenException('You do not own this vehicle');
        }

        return this.prisma.vehicle.update({
            where: { id: vehicleId },
            data: dto,
        });
    }
}
