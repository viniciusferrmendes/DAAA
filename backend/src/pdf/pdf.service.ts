import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
    async generateAccidentPdf(accidentId: number) {
        return {
            accidentId,
            pdfUrl: `mock://accident-${accidentId}.pdf`,
            generatedAt: new Date(),
        };
    }
}