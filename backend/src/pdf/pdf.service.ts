import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
    async generateAccidentPdf(accidentId: number) {
        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();

        const html = `
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1>Relatório de Acidente</h1>
          <p><strong>Accident ID:</strong> ${accidentId}</p>
          <p>Este é um PDF de teste gerado pelo backend.</p>
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
