'use server';

/**
 * @fileOverview An AI agent for drafting daily thoughts.
 *
 * - draftDailyThought - A function that handles the daily thought drafting process.
 * - DraftDailyThoughtInput - The input type for the draftDailyThought function.
 * - DraftDailyThoughtOutput - The return type for the draftDailyThought function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftDailyThoughtInputSchema = z.object({
  topic: z.string().describe('The topic of the daily thought.'),
  mood: z.string().describe('The current mood of the user.'),
});
export type DraftDailyThoughtInput = z.infer<typeof DraftDailyThoughtInputSchema>;

const DraftDailyThoughtOutputSchema = z.object({
  thought: z.string().describe('The drafted daily thought.'),
});
export type DraftDailyThoughtOutput = z.infer<typeof DraftDailyThoughtOutputSchema>;

export async function draftDailyThought(input: DraftDailyThoughtInput): Promise<DraftDailyThoughtOutput> {
  return draftDailyThoughtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftDailyThoughtPrompt',
  input: {schema: DraftDailyThoughtInputSchema},
  output: {schema: DraftDailyThoughtOutputSchema},
  prompt: `You are a helpful AI assistant that helps college students draft daily thoughts to share on their social network.

  Consider the topic and the mood of the user when drafting the thought. The daily thought should be concise and engaging.

  Topic: {{{topic}}}
  Mood: {{{mood}}}

  Drafted Thought:`,
});

const draftDailyThoughtFlow = ai.defineFlow(
  {
    name: 'draftDailyThoughtFlow',
    inputSchema: DraftDailyThoughtInputSchema,
    outputSchema: DraftDailyThoughtOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
