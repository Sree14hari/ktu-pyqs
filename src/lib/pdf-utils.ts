import { PDFDocument } from 'pdf-lib';

// Helper to convert data URI to Uint8Array. `atob` is deprecated in Node but fine in browsers.
function dataUriToUint8Array(dataUri: string): Uint8Array {
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
    mergedPdf.setCreator('PYQ Access App');
    mergedPdf.setProducer('PYQ Access App');

    for (const dataUri of pdfDataUris) {
        try {
            const pdfBytes = dataUriToUint8Array(dataUri);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        } catch (e) {
            console.error("Failed to load or copy a PDF page:", e);
            // Optionally, skip this PDF and continue with others
        }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const base64 = uint8ArrayToBase64(mergedPdfBytes);

    return `data:application/pdf;base64,${base64}`;
}
