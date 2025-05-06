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
    .describe('The initial software architecture design to be refined.'),
});
export type RefineArchitectureDesignInput = z.infer<
  typeof RefineArchitectureDesignInputSchema
>;

const RefineArchitectureDesignOutputSchema = z.object({
  refinedArchitectureDesign: z
    .string()
    .describe('The refined software architecture design.'),
  explanation: z
    .string()
    .describe('An explanation of the changes made to the architecture.'),
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
  architecture design based on the project description, providing a clear
  explanation of the changes you make.

  Project Description: {{{projectDescription}}}
  Initial Architecture Design: {{{initialArchitectureDesign}}}

  Refined Architecture Design: 
  Explanation: `,
});

const refineArchitectureDesignFlow = ai.defineFlow(
  {
    name: 'refineArchitectureDesignFlow',
    inputSchema: RefineArchitectureDesignInputSchema,
    outputSchema: RefineArchitectureDesignOutputSchema,
  },
  async input => {
    const {output} = await refineArchitectureDesignPrompt(input);
    return output!;
  }
);
