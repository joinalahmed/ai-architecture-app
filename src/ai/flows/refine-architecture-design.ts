// src/ai/flows/refine-architecture-design.ts
'use server';

/**
 * @fileOverview Refines a software architecture design based on a project description.
 *
 * - refineArchitectureDesign - A function that refines the architecture design.
 * - RefineArchitectureDesignInput - The input type for the refineArchitectureDesign function.
 * - RefineArchitectureDesignOutput - The return type for the refineArchitectureDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineArchitectureDesignInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the software project.'),
  initialArchitectureDesign: z
    .string()
    .describe('The initial software architecture design to be refined. This can be a list of components or a descriptive text.'),
});
export type RefineArchitectureDesignInput = z.infer<
  typeof RefineArchitectureDesignInputSchema
>;

const RefineArchitectureDesignOutputSchema = z.object({
  refinedArchitectureDesign: z
    .string()
    .describe('The refined software architecture design, typically as a comma or newline-separated list of main components or a descriptive paragraph. This will be used to generate a diagram.'),
  explanation: z
    .string()
    .describe('An explanation of the changes made to the architecture and the reasoning behind the refined design.'),
});
export type RefineArchitectureDesignOutput = z.infer<
  typeof RefineArchitectureDesignOutputSchema
>;

export async function refineArchitectureDesign(
  input: RefineArchitectureDesignInput
): Promise<RefineArchitectureDesignOutput> {
  return refineArchitectureDesignFlow(input);
}

const refineArchitectureDesignPrompt = ai.definePrompt({
  name: 'refineArchitectureDesignPrompt',
  input: {schema: RefineArchitectureDesignInputSchema},
  output: {schema: RefineArchitectureDesignOutputSchema},
  prompt: `You are an expert software architect. You will receive a project
description and an initial architecture design. Your task is to refine the
architecture design based on the project description.

When providing the "refinedArchitectureDesign", please list the key components
as a comma-separated list or each on a new line (e.g., "Web Frontend, API Gateway, User Service, Product Service, Database").
This will be used to generate a visual diagram.

Also, provide a clear "explanation" for the changes you made and the rationale behind your refined design.

Project Description:
{{{projectDescription}}}

Initial Architecture Design:
{{{initialArchitectureDesign}}}
`,
});

const refineArchitectureDesignFlow = ai.defineFlow(
  {
    name: 'refineArchitectureDesignFlow',
    inputSchema: RefineArchitectureDesignInputSchema,
    outputSchema: RefineArchitectureDesignOutputSchema,
  },
  async input => {
    const {output} = await refineArchitectureDesignPrompt(input);
    if (!output) {
      throw new Error('AI did not return an output.');
    }
    // Ensure the output structure matches, even if AI returns slightly different casing for keys.
    // This is a safeguard. Zod validation on output should ideally handle this.
    return {
      refinedArchitectureDesign: output.refinedArchitectureDesign || '',
      explanation: output.explanation || '',
    };
  }
);
