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

const OrientQuestionPaperPagesInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type OrientQuestionPaperPagesInput = z.infer<typeof OrientQuestionPaperPagesInputSchema>;

const OrientQuestionPaperPagesOutputSchema = z.object({
  orientedPdfDataUri: z
    .string()
    .describe(
      'A PDF document as a data URI, with all pages oriented correctly, that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type OrientQuestionPaperPagesOutput = z.infer<typeof OrientQuestionPaperPagesOutputSchema>;

export async function orientQuestionPaperPages(
  input: OrientQuestionPaperPagesInput
): Promise<OrientQuestionPaperPagesOutput> {
  return orientQuestionPaperPagesFlow(input);
}

const pageOrientationTool = ai.defineTool({
  name: 'pageOrientation',
  description: 'Analyzes a single page image and determines if it needs rotation to be right-side-up.',
  inputSchema: z.object({
    pageDataUri: z
      .string()
      .describe(
        'A single page image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      ),
  }),
  outputSchema: z.object({
    rotationNeeded: z
      .number()
      .describe(
        'The number of degrees to rotate the image clockwise to be right-side-up. Should be 0, 90, 180, or 270.'
      ),
  }),
  async input => {
    // In a real implementation, this would use an OCR library or service
    // to determine the correct rotation.
    // This placeholder always returns 0.
    console.log('Page orientation tool called', input.pageDataUri.substring(0, 100));
    return {rotationNeeded: 0};
  },
});

const orientQuestionPaperPagesPrompt = ai.definePrompt({
  name: 'orientQuestionPaperPagesPrompt',
  input: {schema: OrientQuestionPaperPagesInputSchema},
  output: {schema: OrientQuestionPaperPagesOutputSchema},
  tools: [pageOrientationTool],
  prompt: `You are a PDF processing expert. You will receive a PDF document as a data URI. Your task is to ensure that all pages in the PDF are oriented correctly, so that text is right-side-up. Use the pageOrientation tool to determine the rotation needed for each page. The tool will return 0, 90, 180, or 270.

PDF Document: {{pdfDataUri}}`,
});

const orientQuestionPaperPagesFlow = ai.defineFlow(
  {
    name: 'orientQuestionPaperPagesFlow',
    inputSchema: OrientQuestionPaperPagesInputSchema,
    outputSchema: OrientQuestionPaperPagesOutputSchema,
  },
  async input => {
    // In a real implementation, this would call a PDF processing library
    // to split the PDF into individual pages, call the pageOrientationTool on each,
    // rotate the pages as needed, and then merge the pages back into a single PDF.
    // This placeholder simply returns the input PDF without modification.
    const {output} = await orientQuestionPaperPagesPrompt(input);
    return output!;
  }
);
