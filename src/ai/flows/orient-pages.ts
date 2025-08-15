'use server';

/**
 * @fileOverview A flow for fetching and merging PDF documents from URLs.
 *
 * This file contains the logic for fetching multiple PDFs from provided URLs,
 * merging them into a single document, and returning the result as a data URI.
 *
 * - orientQuestionPaperPages - A function that takes PDF URLs, fetches and merges them.
 * - OrientQuestionPaperPagesInput - The input type for the function.
 * - OrientQuestionPaperPagesOutput - The return type for the function.
 */

import {z} from 'zod';
import { mergePdfs } from '@/lib/pdf-utils';
import { fetchPdfAsDataUri } from '@/lib/mock-data';

const OrientQuestionPaperPagesInputSchema = z.object({
  pdfUrls: z.array(z.string().url()),
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
 * Fetches and merges multiple PDF documents from URLs into a single PDF.
 * @param input An object containing an array of PDF URLs.
 * @returns An object containing the data URI of the merged PDF.
 */
export async function orientQuestionPaperPages(
  input: OrientQuestionPaperPagesInput
): Promise<OrientQuestionPaperPagesOutput> {
    const pdfDataUris = await Promise.all(
        input.pdfUrls.map(url => fetchPdfAsDataUri(url))
    );
    const mergedPdfDataUri = await mergePdfs(pdfDataUris);
    return { mergedPdfDataUri };
}
