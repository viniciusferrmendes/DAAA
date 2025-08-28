import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const alicePass = await bcrypt.hash('passwd', 10);
    const bobPass = await bcrypt.hash('passwd', 10);
    const jadePass = await bcrypt.hash('passwd', 10);

    const alice = await prisma.user.create({
        data: {
            email: 'alice@example.com',
            passwordHash: alicePass,
            name: 'Alice',
            contact: '912345678',
        },
    });

    const bob = await prisma.user.create({
        data: {
            email: 'bob@example.com',
            passwordHash: bobPass,
            name: 'Bob',
            contact: '919191919',
        },
    });

    const jade = await prisma.user.create({
        data: {
            email: 'jade@example.com',
            passwordHash: jadePass,
            name: 'Jade',
            contact: '918888888',
        },
    });

    await prisma.vehicle.create({
        data: {
            brand: 'Toyota',
            model: 'Corolla',
            plate: 'AA-11-BB',
            country: 'PT',
            year: 2015,
            userId: alice.id,
            insuranceCompany: 'Fidelidade',
            insurancePolicyNum: 'POL111111',
            insuranceStart: new Date('2024-01-01'),
            insuranceEnd: new Date('2025-01-01'),
        },
    });

    await prisma.vehicle.create({
        data: {
            brand: 'Mazda',
            model: 'MX-3',
            plate: 'HJ-30-YU',
            country: 'PT',
            year: 2008,
            userId: jade.id,
            insuranceCompany: 'Tranquilidade',
            insurancePolicyNum: 'POL1234567',
            insuranceStart: new Date('2024-01-01'),
            insuranceEnd: new Date('2025-01-01'),
        },
    });

    console.log('Seed concluída com sucesso 🚀');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
