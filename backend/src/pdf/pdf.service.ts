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

        const visibleDamages = (accident.visibleDamages as any) ?? {};
        const observations = (accident.observations as any) ?? {};
        const signatures = (accident.signatures as any) ?? {};

        // A
        const partyA = accident.parties.find(p => p.role === 'A');
        const insuredA = (partyA?.insured as any) ?? {};
        const vehicleA = (partyA?.vehicle as any) ?? {};
        const insuranceA = (partyA?.insurance as any) ?? {};

        const driverAName = `${insuredA.name ?? ''} ${insuredA.surname ?? ''}`.trim() || '-';
        const vehicleAModel = vehicleA.brandModel ?? '-';
        const vehicleAPlate = vehicleA.plate ?? '-';
        const insuranceCompanyA = insuranceA.insuranceCompany ?? '-';
        const insurancePolicyA = insuranceA.policyNumber ?? '-';
        const observationA = observations.vehicleA ?? '-';
        const visibleDamagesA = visibleDamages.vehicleA ?? '-';
        const signatureA = signatures.vehicleA ?? null;
        const signatureAHtml = signatureA
            ? `<img src="${signatureA}" alt="Assinatura Veículo A" style="max-height: 80px; max-width: 100%; object-fit: contain;" />`
            : '-';

        // B
        const partyB = accident.parties.find(p => p.role === 'B');
        const insuredB = (partyB?.insured as any) ?? {};
        const vehicleB = (partyB?.vehicle as any) ?? {};
        const insuranceB = (partyB?.insurance as any) ?? {};

        const driverBName = `${insuredB.name ?? ''} ${insuredB.surname ?? ''}`.trim() || '-';
        const vehicleBModel = vehicleB.brandModel ?? '-';
        const vehicleBPlate = vehicleB.plate ?? '-';
        const insuranceCompanyB = insuranceB.insuranceCompany ?? '-';
        const insurancePolicyB = insuranceB.policyNumber ?? '-';
        const observationB = observations.vehicleB ?? '-';
        const visibleDamagesB = visibleDamages.vehicleB ?? '-';
        const signatureB = signatures.vehicleB ?? null;
        const signatureBHtml = signatureB
            ? `<img src="${signatureB}" alt="Assinatura Veículo B" style="max-height: 80px; max-width: 100%; object-fit: contain;" />`
            : '-';

        const browser = await puppeteer.launch({
            headless: true,
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
            .replace(/{{driverAName}}/g, driverAName)
            .replace(/{{vehicleAModel}}/g, vehicleAModel)
            .replace(/{{vehicleAPlate}}/g, vehicleAPlate)
            .replace(/{{insuranceCompanyA}}/g, insuranceCompanyA)
            .replace(/{{insurancePolicyA}}/g, insurancePolicyA)
            .replace(/{{obsA}}/g, observationA)
            .replace(/{{visibleDamagesA}}/g, visibleDamagesA)
            .replace(/{{witnessesA}}/g, witnessesAHtml)
            .replace(/{{signatureA}}/g, signatureAHtml)
            .replace(/{{driverBName}}/g, driverBName)
            .replace(/{{vehicleBModel}}/g, vehicleBModel)
            .replace(/{{vehicleBPlate}}/g, vehicleBPlate)
            .replace(/{{insuranceCompanyB}}/g, insuranceCompanyB)
            .replace(/{{insurancePolicyB}}/g, insurancePolicyB)
            .replace(/{{obsB}}/g, observationB)
            .replace(/{{visibleDamagesB}}/g, visibleDamagesB)
            .replace(/{{witnessesB}}/g, witnessesBHtml)
            .replace(/{{signatureB}}/g, signatureBHtml);

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
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
            generatedAt: new Date(),
        };
    }
}
