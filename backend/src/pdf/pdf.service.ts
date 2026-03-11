import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
    constructor(private readonly prisma: PrismaService) { }

    async generateAccidentPdf(accidentId: number) {
        const accident = await this.prisma.accident.findUnique({
            where: { id: accidentId },
            include: {
                parties: true,
            },
        });

        if (!accident) {
            throw new NotFoundException('Accident not found');
        }

        const partyA = accident.parties.find(p => p.role === 'A');
        const partyB = accident.parties.find(p => p.role === 'B');

        const insuredA = (partyA?.insured as any) ?? {};
        const vehicleA = (partyA?.vehicle as any) ?? {};
        const insuranceA = (partyA?.insurance as any) ?? {};

        const insuredB = (partyB?.insured as any) ?? {};
        const vehicleB = (partyB?.vehicle as any) ?? {};
        const insuranceB = (partyB?.insurance as any) ?? {};

        const observations = (accident.observations as any) ?? {};

        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();

        const html = `
        <html>
        <body style="font-family: Arial; padding: 40px;">

            <h1>Declaração de Acidente</h1>

            <h2>Informações Gerais</h2>
            <p><strong>Data/Hora:</strong> ${accident.dateTime ?? '-'}</p>
            <p><strong>Local:</strong> ${accident.address ?? '-'}</p>
            <p><strong>País:</strong> ${accident.country ?? '-'}</p>

            <hr/>

            <h2>Condutor A</h2>
            <p><strong>Nome:</strong> ${insuredA.name ?? '-'}</p>
            <p><strong>Apelido:</strong> ${insuredA.surname ?? '-'}</p>
            <p><strong>Veículo:</strong> ${vehicleA.brandModel ?? '-'}</p>
            <p><strong>Matrícula:</strong> ${vehicleA.plate ?? '-'}</p>
            <p><strong>Seguradora:</strong> ${insuranceA.insuranceCompany ?? '-'}</p>

            <hr/>

            <h2>Condutor B</h2>
            <p><strong>Nome:</strong> ${insuredB.name ?? '-'}</p>
            <p><strong>Apelido:</strong> ${insuredB.surname ?? '-'}</p>
            <p><strong>Veículo:</strong> ${vehicleB.brandModel ?? '-'}</p>
            <p><strong>Matrícula:</strong> ${vehicleB.plate ?? '-'}</p>
            <p><strong>Seguradora:</strong> ${insuranceB.insuranceCompany ?? '-'}</p>

            <hr/>

            <h2>Observações</h2>
            <p><strong>Veículo A:</strong> ${observations.vehicleA ?? '-'}</p>
            <p><strong>Veículo B:</strong> ${observations.vehicleB ?? '-'}</p>

        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        const outputDir = path.join(process.cwd(), 'generated-pdfs');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `accident-${accidentId}.pdf`;
        const filePath = path.join(outputDir, fileName);

        fs.writeFileSync(filePath, pdfBuffer);

        return {
            pdfBuffer,
            pdfUrl: `/generated-pdfs/${fileName}`,
            generatedAt: new Date()
        };
    }
}