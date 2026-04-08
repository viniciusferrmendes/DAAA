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
        const circumstances = (accident.circumstances as any) ?? {};
        const collisionPoint = (accident.collisionPoint as any) ?? {};
        const collisionPointMap: Record<string, string> = {
            'front': 'Frente',
            'rear': 'Traseira',
            'left': 'Lado esquerdo',
            'right': 'Lado direito',
            'front-left': 'Frente esquerda',
            'front-right': 'Frente direita',
            'rear-left': 'Traseira esquerda',
            'rear-right': 'Traseira direita'
        };
        const officialCircumstances: Record<number, string> = {
            1: 'Estava estacionado / Parado',
            2: 'Saía de estacionamento / Abria uma porta',
            3: 'Ia estacionar',
            4: 'Saía de um parque de estacionamento, de local privado ou de um caminho particular',
            5: 'Entrava num parque de estacionamento, local privado ou num caminho particular',
            6: 'Entrava numa rotunda ou praça de sentido giratório',
            7: 'Circulava numa rotunda ou praça de sentido giratório',
            8: 'Embateu na traseira de outro veículo que circulava no mesmo sentido e na mesma fila',
            9: 'Circulava no mesmo sentido, mas numa fila diferente',
            10: 'Mudava de fila',
            11: 'Ultrapassava',
            12: 'Virava à direita',
            13: 'Virava à esquerda',
            14: 'Recuava',
            15: 'Circulava na faixa contrária',
            16: 'Aparecia pela direita num cruzamento',
            17: 'Não respeitou prioridade ou semáforo'
        };

        const signatures = (accident.signatures as any) ?? {};
        const sketchUrl = accident.sketchUrl ?? null;

        const sketchHtml = sketchUrl
            ? `<img src="${sketchUrl}" alt="Croqui do acidente" style="max-width:100%; max-height:300px; object-fit:contain; display:block;" />`
            : '<span>-</span>';

        const renderCircumstancesTable = (
            aList: number[] | undefined,
            bList: number[] | undefined,
        ) => {
            const aSet = new Set(aList ?? []);
            const bSet = new Set(bList ?? []);

            return Object.entries(officialCircumstances)
                .map(([key, label]) => {
                    const id = Number(key);

                    const markA = aSet.has(id) ? '■' : '□';
                    const markB = bSet.has(id) ? '■' : '□';

                    return `
                <div style="display:flex; border-bottom:1px solid #000; padding:3px 0; align-items:center;">
                    <div style="flex:1; padding-right:5px;">${id}. ${label}</div>
                    <div style="width:25px; text-align:center; font-weight:bold;">${markA}</div>
                    <div style="width:25px; text-align:center; font-weight:bold;">${markB}</div>
                </div>
            `;
                })
                .join('');
        };

        const circumstancesTable = renderCircumstancesTable(
            circumstances.vehicleA,
            circumstances.vehicleB,
        );

        // Party A
        const partyA = accident.parties.find(p => p.role === 'A');
        const insuredA = (partyA?.insured as any) ?? {};
        const vehicleA = (partyA?.vehicle as any) ?? {};
        const insuranceA = (partyA?.insurance as any) ?? {};
        const driverA = (partyA?.driver as any) ?? {};

        const insuredAName = `${insuredA.name ?? ''} ${insuredA.surname ?? ''}`.trim() || '-';
        const insuredAAddress = insuredA.address ?? '-';
        const insuredAContact = insuredA.contact ?? '-';
        const insuredANif = insuredA.nif ?? '-';

        const vehicleAModel = vehicleA.brandModel ?? '-';
        const vehicleAPlate = vehicleA.plate ?? '-';
        const vehicleACountry = vehicleA.country ?? '-';

        const insuranceCompanyA = insuranceA.insuranceCompany ?? '-';
        const insurancePolicyA = insuranceA.policyNumber ?? '-';
        const greenCardA = insuranceA.greenCard ?? '-';

        const driverAName = `${driverA.name ?? ''} ${driverA.surname ?? ''}`.trim() || '-';
        const driverAAddress = driverA.address ?? '-';
        const driverAContact = driverA.contact ?? '-';
        const driverALicense = driverA.licenseNumber ?? '-';

        const observationA = observations.vehicleA ?? '-';
        const visibleDamagesA = visibleDamages.vehicleA ?? '-';
        const collisionPointA = collisionPointMap[collisionPoint.vehicleA] ?? '-';
        const collisionA = collisionPoint.vehicleA;
        function isActive(value: string, target: string) {
            return value === target ? 'active' : '';
        }
        const possibleCarImagePaths = [
            path.resolve(process.cwd(), 'dist/pdf/assets/car-top.png'),
            path.resolve(process.cwd(), 'dist/src/pdf/assets/car-top.png'),
            path.resolve(process.cwd(), 'src/pdf/assets/car-top.png'),
        ];
        const carImagePath = possibleCarImagePaths.find((filePath) => fs.existsSync(filePath));
        if (!carImagePath) {
            throw new Error('car-top.png not found in expected paths');
        }

        const carImageBase64 = fs.readFileSync(carImagePath).toString('base64');
        const signatureA = signatures.vehicleA ?? null;
        const signatureAHtml = signatureA
            ? `<img src="${signatureA}" alt="Assinatura Veículo A" style="max-height: 80px; max-width: 100%; object-fit: contain;" />`
            : '-';

        // Party B
        const partyB = accident.parties.find(p => p.role === 'B');
        const insuredB = (partyB?.insured as any) ?? {};
        const vehicleB = (partyB?.vehicle as any) ?? {};
        const insuranceB = (partyB?.insurance as any) ?? {};
        const driverB = (partyB?.driver as any) ?? {};

        const insuredBName = `${insuredB.name ?? ''} ${insuredB.surname ?? ''}`.trim() || '-';
        const insuredBAddress = insuredB.address ?? '-';
        const insuredBContact = insuredB.contact ?? '-';
        const insuredBNif = insuredB.nif ?? '-';

        const vehicleBModel = vehicleB.brandModel ?? '-';
        const vehicleBPlate = vehicleB.plate ?? '-';
        const vehicleBCountry = vehicleB.country ?? '-';

        const insuranceCompanyB = insuranceB.insuranceCompany ?? '-';
        const insurancePolicyB = insuranceB.policyNumber ?? '-';
        const greenCardB = insuranceB.greenCard ?? '-';

        const driverBName = `${driverB.name ?? ''} ${driverB.surname ?? ''}`.trim() || '-';
        const driverBAddress = driverB.address ?? '-';
        const driverBContact = driverB.contact ?? '-';
        const driverBLicense = driverB.licenseNumber ?? '-';

        const observationB = observations.vehicleB ?? '-';
        const visibleDamagesB = visibleDamages.vehicleB ?? '-';
        const collisionPointB = collisionPointMap[collisionPoint.vehicleB] ?? '-';
        const collisionB = collisionPoint.vehicleB;
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
            .replace(/{{circumstancesTable}}/g, circumstancesTable)

            .replace(/{{insuredAName}}/g, insuredAName)
            .replace(/{{insuredAAddress}}/g, insuredAAddress)
            .replace(/{{insuredAContact}}/g, insuredAContact)
            .replace(/{{insuredANif}}/g, insuredANif)

            .replace(/{{vehicleAModel}}/g, vehicleAModel)
            .replace(/{{vehicleAPlate}}/g, vehicleAPlate)
            .replace(/{{vehicleACountry}}/g, vehicleACountry)

            .replace(/{{insuranceCompanyA}}/g, insuranceCompanyA)
            .replace(/{{insurancePolicyA}}/g, insurancePolicyA)
            .replace(/{{greenCardA}}/g, greenCardA)

            .replace(/{{driverAName}}/g, driverAName)
            .replace(/{{driverAAddress}}/g, driverAAddress)
            .replace(/{{driverAContact}}/g, driverAContact)
            .replace(/{{driverALicense}}/g, driverALicense)

            .replace(/{{obsA}}/g, observationA)
            .replace(/{{visibleDamagesA}}/g, visibleDamagesA)
            .replace('{{collisionPointA}}', collisionPointA)
            .replace('{{collisionA_front}}', isActive(collisionA, 'front'))
            .replace('{{collisionA_front_left}}', isActive(collisionA, 'front-left'))
            .replace('{{collisionA_front_right}}', isActive(collisionA, 'front-right'))
            .replace('{{collisionA_left}}', isActive(collisionA, 'left'))
            .replace('{{collisionA_right}}', isActive(collisionA, 'right'))
            .replace('{{collisionA_rear_left}}', isActive(collisionA, 'rear-left'))
            .replace('{{collisionA_rear}}', isActive(collisionA, 'rear'))
            .replace('{{collisionA_rear_right}}', isActive(collisionA, 'rear-right'))
            .replace('{{carImage}}', `data:image/png;base64,${carImageBase64}`)
            .replace(/{{witnessesA}}/g, witnessesAHtml)
            .replace(/{{signatureA}}/g, signatureAHtml)

            .replace(/{{insuredBName}}/g, insuredBName)
            .replace(/{{insuredBAddress}}/g, insuredBAddress)
            .replace(/{{insuredBContact}}/g, insuredBContact)
            .replace(/{{insuredBNif}}/g, insuredBNif)

            .replace(/{{vehicleBModel}}/g, vehicleBModel)
            .replace(/{{vehicleBPlate}}/g, vehicleBPlate)
            .replace(/{{vehicleBCountry}}/g, vehicleBCountry)

            .replace(/{{insuranceCompanyB}}/g, insuranceCompanyB)
            .replace(/{{insurancePolicyB}}/g, insurancePolicyB)
            .replace(/{{greenCardB}}/g, greenCardB)

            .replace(/{{driverBName}}/g, driverBName)
            .replace(/{{driverBAddress}}/g, driverBAddress)
            .replace(/{{driverBContact}}/g, driverBContact)
            .replace(/{{driverBLicense}}/g, driverBLicense)

            .replace(/{{obsB}}/g, observationB)
            .replace(/{{visibleDamagesB}}/g, visibleDamagesB)
            .replace(/{{collisionPointB}}/g, collisionPointB)
            .replace('{{collisionB_front}}', isActive(collisionB, 'front'))
            .replace('{{collisionB_front_left}}', isActive(collisionB, 'front-left'))
            .replace('{{collisionB_front_right}}', isActive(collisionB, 'front-right'))
            .replace('{{collisionB_left}}', isActive(collisionB, 'left'))
            .replace('{{collisionB_right}}', isActive(collisionB, 'right'))
            .replace('{{collisionB_rear_left}}', isActive(collisionB, 'rear-left'))
            .replace('{{collisionB_rear}}', isActive(collisionB, 'rear'))
            .replace('{{collisionB_rear_right}}', isActive(collisionB, 'rear-right'))
            .replace(/{{witnessesB}}/g, witnessesBHtml)
            .replace(/{{signatureB}}/g, signatureBHtml)
            .replace(/{{sketch}}/g, sketchHtml);

        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

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
