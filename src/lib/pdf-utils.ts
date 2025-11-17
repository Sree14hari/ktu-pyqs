import { PDFDocument, StandardFonts, rgb, PDFFont, PDFHexString, PDFName } from 'pdf-lib';

// Helper to convert data URI to Uint8Array.
export function dataUriToUint8Array(dataUri: string): Uint8Array {
    const base64 = dataUri.split(',')[1];
    if (!base64) {
        throw new Error("Invalid data URI: no base64 content");
    }
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper to convert Uint8Array to a base64 string
function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function mergePdfs(pdfDataUris: string[]): Promise<string> {
    const mergedPdf = await PDFDocument.create();
    mergedPdf.setCreator('KTUHUB');
    mergedPdf.setProducer('KTUHUB');

    for (const dataUri of pdfDataUris) {
        try {
            const pdfBytes = dataUriToUint8Array(dataUri);
            const pdfDoc = await PDFDocument.load(pdfBytes, {
                // Skips trying to parse the structure of malformed PDFs.
                updateMetadata: false 
            });
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        } catch (e) {
            console.error("Failed to load or copy a PDF page:", e);
            // Optionally, skip this PDF and continue with others
        }
    }

    const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

    // Add footer to each page
    const pages = mergedPdf.getPages();
    for (const page of pages) {
        const { width, height } = page.getSize();
        const text = 'Generated from KTUHUB';
        const url = 'https://ktuhub.vercel.app';
        const fontSize = 10;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        const x = width / 2 - textWidth / 2;
        const y = 20;

        page.drawText(text, {
            x: x,
            y: y,
            font: helveticaFont,
            size: fontSize,
            color: rgb(0.5, 0.5, 0.5),
        });

        const linkAnnotation = {
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, y, x + textWidth, y + textHeight],
            Border: [0, 0, 0],
            A: {
                Type: 'Action',
                S: 'URI',
                URI: PDFHexString.fromText(url),
            },
        };

        const annots = page.node.lookup(PDFName.of('Annots'));
        if (annots) {
            page.node.set(PDFName.of('Annots'), mergedPdf.context.obj([linkAnnotation, ...annots.asArray()]));
        } else {
            page.node.set(PDFName.of('Annots'), mergedPdf.context.obj([linkAnnotation]));
        }
    }

    const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
    const base64 = uint8ArrayToBase64(mergedPdfBytes);

    return `data:application/pdf;base64,${base64}`;
}


export async function generateSgpaPdf(subjects: { courseName: string, credits: string, grade: string }[], sgpa: number): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const titleSize = 18;
    const margin = 50;
    let y = height - margin - titleSize;

    // Title
    page.drawText('SGPA Calculation Report', {
        x: margin,
        y,
        font: boldFont,
        size: titleSize,
        color: rgb(0, 0, 0),
    });

    y -= 30;

    // Table Header
    const tableTop = y;
    const courseNameX = margin;
    const creditsX = width - margin - 150;
    const gradeX = width - margin - 50;

    page.drawText('Course Name', { x: courseNameX, y: tableTop, font: boldFont, size: fontSize });
    page.drawText('Credits', { x: creditsX, y: tableTop, font: boldFont, size: fontSize });
    page.drawText('Grade', { x: gradeX, y: tableTop, font: boldFont, size: fontSize });

    y -= 20;

    // Table Rows
    subjects.forEach((subject, index) => {
        if (y < margin + 20) { // Add new page if content overflows
            const newPage = pdfDoc.addPage();
            y = newPage.getHeight() - margin;
        }
        const courseName = subject.courseName.trim() || `Subject ${index + 1}`;
        page.drawText(courseName, { x: courseNameX, y, font, size: fontSize });
        page.drawText(subject.credits, { x: creditsX + 20, y, font, size: fontSize });
        page.drawText(subject.grade, { x: gradeX + 15, y, font, size: fontSize });
        y -= 20;
    });

    // Separator Line
    y -= 10;
    page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });
    y -= 30;

    // Final SGPA
    page.drawText('Final SGPA:', {
        x: width - margin - 150,
        y,
        font: boldFont,
        size: 14,
    });
    page.drawText(sgpa.toFixed(2), {
        x: width - margin - 50,
        y,
        font: boldFont,
        size: 14,
        color: rgb(0.1, 0.5, 0.1),
    });

    // Footer
    page.drawText(`Generated on ${new Date().toLocaleDateString()} from KTUHUB`, {
      x: margin,
      y: margin - 20,
      font,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });


    const pdfBytes = await pdfDoc.save();
    return `data:application/pdf;base64,${uint8ArrayToBase64(pdfBytes)}`;
}
