import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log("pdf-parse type:", typeof pdfParse, pdfParse);
const inspect = async () => {
    const dataBuffer = fs.readFileSync('C:\\Program Files\\HP\\Documentation\\platform_guides\\ug\\M86238-001.pdf');
    try {
        let text = '';
        if (typeof pdfParse === 'function') {
            const result = await pdfParse(dataBuffer);
            text = result.text;
        } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
            const parser = new pdfParse.PDFParse({ data: dataBuffer });
            const result = await parser.getText();
            text = result.text;
        } else {
            throw new Error("Unable to parse PDF with available exports");
        }
        console.log("Success! Extracted text length:", text.length);
        console.log("First 200 chars:\n", text.substring(0, 200));
    } catch (e) {
        console.error("error inside inspect:", e);
    }
};

inspect().catch(console.error);
