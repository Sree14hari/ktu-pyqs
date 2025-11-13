
'use server';

/**
 * @fileOverview A flow for preparing PDF URLs to be fetched by the client.
 *
 * This file contains the logic for taking a list of PDF URLs and passing them
 * through to be processed on the client-side.
 *
 * - preparePdfUrls - A function that takes PDF URLs and prepares them for the client.
 * - PreparePdfUrlsInput - The input type for the function.
 * - PreparePdfUrlsOutput - The return type for the function.
 */

import {z} from 'zod';

const PreparePdfUrlsInputSchema = z.object({
  pdfUrls: z.array(z.string().url()),
});
export type PreparePdfUrlsInput = z.infer<typeof PreparePdfUrlsInputSchema>;

const PreparePdfUrlsOutputSchema = z.object({
  pdfUrls: z.array(z.string()),
});
export type PreparePdfUrlsOutput = z.infer<typeof PreparePdfUrlsOutputSchema>;

/**
 * Simply passes through the PDF URLs to the client.
 * @param input An object containing an array of PDF URLs.
 * @returns An object containing the same array of PDF URLs.
 */
export async function preparePdfUrls(
  input: PreparePdfUrlsInput
): Promise<PreparePdfUrlsOutput> {
    // In this client-side merging architecture, the server just passes the URLs through.
    // The client will handle fetching via the proxy.
    return { pdfUrls: input.pdfUrls };
}
