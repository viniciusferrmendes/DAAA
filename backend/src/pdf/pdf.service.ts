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

        const possiblePaths = [
            path.join(__dirname, 'templates', 'accident-template.html'),
            path.join(process.cwd(), 'dist', 'pdf', 'templates', 'accident-template.html'),
            path.join(process.cwd(), 'src', 'pdf', 'templates', 'accident-template.html'),
        ];

        const templatePath = possiblePaths.find((filePath) => fs.existsSync(filePath));

        if (!templatePath) {
            throw new NotFoundException('PDF template not found');
        }

        let html = fs.readFileSync(templatePath, 'utf-8');

        const witnessesA = (accident.witnessesA as any[]) ?? [];
        const witnessesB = (accident.witnessesB as any[]) ?? [];

        const formatWitnesses = (list: any[]) => {
            if (!list.length) {
                return '<p>-</p>';
            }

            return list
                .map(
                    (w) => `
                <div class="witness-item">
                    <span class="label">Nome:</span> ${w.name ?? '-'}<br>
                    <span class="label">Morada:</span> ${w.address ?? '-'}<br>
                    <span class="label">Contacto:</span> ${w.contact ?? '-'}
                </div>
            `,
                )
                .join('');
        };

        const witnessesAHtml = formatWitnesses(witnessesA);
        const witnessesBHtml = formatWitnesses(witnessesB);

        html = html
            .replace('{{date}}', accident.dateTime ? new Date(accident.dateTime).toLocaleString('pt-PT') : '-')
            .replace('{{address}}', accident.address ?? '-')
            .replace('{{country}}', accident.country ?? '-')
            .replace('{{driverAName}}', `${insuredA.name ?? ''} ${insuredA.surname ?? ''}`.trim() || '-')
            .replace('{{vehicleAModel}}', vehicleA.brandModel ?? '-')
            .replace('{{vehicleAPlate}}', vehicleA.plate ?? '-')
            .replace('{{driverBName}}', `${insuredB.name ?? ''} ${insuredB.surname ?? ''}`.trim() || '-')
            .replace('{{vehicleBModel}}', vehicleB.brandModel ?? '-')
            .replace('{{vehicleBPlate}}', vehicleB.plate ?? '-')
            .replace('{{obsA}}', observations.vehicleA ?? '-')
            .replace('{{obsB}}', observations.vehicleB ?? '-')
            .replace('{{witnessesA}}', witnessesAHtml)
            .replace('{{witnessesB}}', witnessesBHtml);

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
