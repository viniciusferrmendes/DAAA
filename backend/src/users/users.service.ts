import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        return this.prisma.user.create({ data: dto });
    }

    async findAll() {
        return this.prisma.user.findMany({
            orderBy: { id: 'asc' },
            select: { id: true, email: true, name: true, contact: true, createdAt: true },
        });
    }
}
