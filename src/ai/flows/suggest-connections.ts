'use server';
/**
 * @fileOverview An AI agent that suggests connections between students based on similar interests.
 *
 * - suggestConnections - A function that suggests student connections.
 * - SuggestConnectionsInput - The input type for the suggestConnections function.
 * - SuggestConnectionsOutput - The return type for the suggestConnections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConnectionsInputSchema = z.object({
  studentProfile: z.string().describe('The profile of the student requesting connection suggestions.'),
  otherStudentProfiles: z.array(z.string()).describe('The profiles of other students in the network.'),
  numberOfSuggestions: z.number().default(3).describe('The number of connection suggestions to provide.'),
});
export type SuggestConnectionsInput = z.infer<typeof SuggestConnectionsInputSchema>;

const SuggestConnectionsOutputSchema = z.array(z.string()).describe('A list of suggested student profiles to connect with.');
export type SuggestConnectionsOutput = z.infer<typeof SuggestConnectionsOutputSchema>;

export async function suggestConnections(input: SuggestConnectionsInput): Promise<SuggestConnectionsOutput> {
  return suggestConnectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConnectionsPrompt',
  input: {schema: SuggestConnectionsInputSchema},
  output: {schema: SuggestConnectionsOutputSchema},
  prompt: `You are a college relationship assistant bot helping students find peers with similar interests.

Given the following student profile:

{{studentProfile}}

And the following list of other student profiles:

{{#each otherStudentProfiles}}
- {{this}}
{{/each}}

Suggest {{numberOfSuggestions}} students from the otherStudentProfiles list that the student should connect with, based on similar interests. Only return the suggested student profiles in the array.`, 
});

const suggestConnectionsFlow = ai.defineFlow(
  {
    name: 'suggestConnectionsFlow',
    inputSchema: SuggestConnectionsInputSchema,
    outputSchema: SuggestConnectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
