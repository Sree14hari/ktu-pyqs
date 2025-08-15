'use server';

/**
 * @fileOverview A passthrough flow for handling PDF documents.
 *
 * This file previously contained logic for AI-powered page orientation. It has been simplified
 * to act as a direct passthrough for PDF data, as the orientation feature was removed.
 *
 * - orientQuestionPaperPages - A function that takes a PDF data URI and returns it.
 * - OrientQuestionPaperPagesInput - The input type for the function.
 * - OrientQuestionPaperPagesOutput - The return type for the function.
 */

import {z} from 'zod';
import { mergePdfs } from '@/lib/pdf-utils';

const OrientQuestionPaperPagesInputSchema = z.object({
  pdfDataUris: z.array(z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
  ),
});
export type OrientQuestionPaperPagesInput = z.infer<typeof OrientQuestionPaperPagesInputSchema>;

const OrientQuestionPaperPagesOutputSchema = z.object({
  mergedPdfDataUri: z
    .string()
    .describe(
      "A merged PDF document as a data URI, that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OrientQuestionPaperPagesOutput = z.infer<typeof OrientQuestionPaperPagesOutputSchema>;

/**
 * Merges multiple PDF documents provided as data URIs into a single PDF.
 * @param input An object containing an array of PDF data URIs.
 * @returns An object containing the data URI of the merged PDF.
 */
export async function orientQuestionPaperPages(
  input: OrientQuestionPaperPagesInput
): Promise<OrientQuestionPaperPagesOutput> {
    const mergedPdfDataUri = await mergePdfs(input.pdfDataUris);
    return { mergedPdfDataUri };
}
