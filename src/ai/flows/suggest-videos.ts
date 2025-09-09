'use server';
/**
 * @fileOverview A flow for suggesting YouTube videos for a given course.
 *
 * - suggestVideos - A function that suggests YouTube videos for a course.
 * - SuggestVideosInput - The input type for the suggestVideos function.
 * - SuggestVideosOutput - The return type for the suggestVideos function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestVideosInputSchema = z.object({
  courseName: z.string().describe('The name of the course to find videos for.'),
});
export type SuggestVideosInput = z.infer<typeof SuggestVideosInputSchema>;

const VideoSuggestionSchema = z.object({
  title: z
    .string()
    .describe('The title of the YouTube video.'),
  searchQuery: z
    .string()
    .describe('A good YouTube search query to find this video or similar ones.'),
  videoId: z
    .string()
    .optional()
    .describe('The YouTube video ID. Only provide this if you are highly confident you can find a relevant video ID.'),
});

const SuggestVideosOutputSchema = z.object({
  videos: z
    .array(VideoSuggestionSchema)
    .describe('A list of suggested YouTube videos.'),
});
export type SuggestVideosOutput = z.infer<typeof SuggestVideosOutputSchema>;

const suggestVideosFlow = ai.defineFlow(
  {
    name: 'suggestVideosFlow',
    inputSchema: SuggestVideosInputSchema,
    outputSchema: SuggestVideosOutputSchema,
  },
  async (input) => {
    const prompt = `You are an academic assistant. Your goal is to help a student find relevant YouTube videos for their course: "${input.courseName}".
    
    Suggest 5 relevant YouTube videos. For each video, provide:
    1. A clear title.
    2. A concise, effective YouTube search query.
    3. If you are very confident you can find a specific, highly relevant video, provide its YouTube videoId. If not, omit the videoId.
    
    Do not make up videoIds.`;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: SuggestVideosOutputSchema,
      },
    });
    return output!;
  }
);

export async function suggestVideos(input: SuggestVideosInput): Promise<SuggestVideosOutput> {
  return suggestVideosFlow(input);
}
