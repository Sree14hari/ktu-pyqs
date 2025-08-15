'use server';

/**
 * @fileOverview AI-powered page orientation adjustment for question papers.
 *
 * - orientQuestionPaperPages - A function that takes a PDF data URI and returns a PDF data URI with pages oriented correctly.
 * - OrientQuestionPaperPagesInput - The input type for the orientQuestionPaperPages function.
 * - OrientQuestionPaperPagesOutput - The return type for the orientQuestionPaperPages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {PDFDocument, degrees, PageSizes, grayscale} from 'pdf-lib';
import {dataUriToUint8Array, mergePdfs} from '@/lib/pdf-utils';

const OrientQuestionPaperPagesInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OrientQuestionPaperPagesInput = z.infer<typeof OrientQuestionPaperPagesInputSchema>;

const OrientQuestionPaperPagesOutputSchema = z.object({
  orientedPdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI, with all pages oriented correctly, that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OrientQuestionPaperPagesOutput = z.infer<typeof OrientQuestionPaperPagesOutputSchema>;

export async function orientQuestionPaperPages(
  input: OrientQuestionPaperPagesInput
): Promise<OrientQuestionPaperPagesOutput> {
  return orientQuestionPaperPagesFlow(input);
}

const rotationSchema = z.object({
  rotation: z.enum(['0', '90', '180', '270']).describe('The required clockwise rotation in degrees to make the page upright. Can be 0, 90, 180, or 270.'),
});

const pageOrientationPrompt = ai.definePrompt({
    name: 'pageOrientationPrompt',
    input: { schema: z.object({ pageImage: z.string() }) },
    output: { schema: rotationSchema },
    prompt: 'You are a document processing expert. Analyze the provided image of a document page and determine the necessary clockwise rotation to make it right-side-up. Only provide one of the following rotation values: 0, 90, 180, or 270. Image: {{media url=pageImage}}',
    config: {
        temperature: 0.1
    }
});


async function getPageRotation(pageImage: string): Promise<number> {
    const { output } = await pageOrientationPrompt({ pageImage });
    return parseInt(output!.rotation, 10);
}

const orientQuestionPaperPagesFlow = ai.defineFlow(
  {
    name: 'orientQuestionPaperPagesFlow',
    inputSchema: OrientQuestionPaperPagesInputSchema,
    outputSchema: OrientQuestionPaperPagesOutputSchema,
  },
  async ({ pdfDataUri }) => {
    const pdfBytes = dataUriToUint8Array(pdfDataUri);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const tempDoc = await PDFDocument.create();

    const pageIndices = pdfDoc.getPageIndices();
    const rotatedPageUris = [];

    for (const pageIndex of pageIndices) {
        const sourceDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const [page] = await sourceDoc.copyPages(pdfDoc, [pageIndex]);

        // Create a temporary document with just this page to render it
        const tempPageDoc = await PDFDocument.create();
        const [tempPage] = await tempPageDoc.copyPages(sourceDoc, [pageIndex]);
        tempPageDoc.addPage(tempPage);
        const tempPdfBytes = await tempPageDoc.save({ useObjectStreams: false });
        const tempPdfDataUri = `data:application/pdf;base64,${Buffer.from(tempPdfBytes).toString('base64')}`;

        const rotationDegrees = await getPageRotation(tempPdfDataUri);

        if (rotationDegrees !== 0) {
            page.setRotation(degrees(rotationDegrees));
        }

        const finalPageDoc = await PDFDocument.create();
        const [finalPage] = await finalPageDoc.copyPages(sourceDoc, [pageIndex]);
        if (rotationDegrees !== 0) {
            finalPage.setRotation(degrees(rotationDegrees));
        }
        finalPageDoc.addPage(finalPage);
        const finalPdfBytes = await finalPageDoc.save();
        rotatedPageUris.push(`data:application/pdf;base64,${Buffer.from(finalPdfBytes).toString('base64')}`);
    }

    const orientedPdfDataUri = await mergePdfs(rotatedPageUris);
    
    return { orientedPdfDataUri };
  }
);
