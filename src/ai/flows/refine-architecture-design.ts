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
    .describe('A detailed description of the software project, including key features, user stories, non-functional requirements (scalability, security, performance), and any known constraints or existing systems to integrate with.'),
  initialArchitectureDesign: z
    .string()
    .describe('The initial software architecture design to be refined. This can be a list of components, a descriptive text, or even "none" if starting from scratch. If providing components, try to indicate relationships if known (e.g., "Frontend connects to API Gateway").'),
});
export type RefineArchitectureDesignInput = z.infer<
  typeof RefineArchitectureDesignInputSchema
>;

const RefineArchitectureDesignOutputSchema = z.object({
  refinedArchitectureDesign: z
    .string()
    .describe(`The refined software architecture design, as a comma or newline-separated list of main components. 
Each component should be clearly named. If possible, suggest a type for each component (e.g., Frontend, API, Database, Cache, Message Queue, Service, External System). 
Example: "React Frontend (Frontend), API Gateway (API), User Service (Service), Product Database (Database), Stripe API (External System)".
This list will be used to generate a visual diagram.
Try to also implicitly suggest connections or flow if natural, e.g., "User Authentication Service (Service) which talks to User Database (Database)".`),
  explanation: z
    .string()
    .describe('An explanation of the changes made to the architecture and the reasoning behind the refined design. Highlight key decisions, trade-offs, and how the design addresses the project requirements.'),
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
description and an initial (or non-existent) architecture design. Your task is to
provide a refined and robust architecture design based on the project description.

Project Description:
{{{projectDescription}}}

Initial Architecture Design:
{{{initialArchitectureDesign}}}

Your Output (MUST follow this structure):
1.  **Refined Architecture Design (refinedArchitectureDesign)**:
    *   Provide a clear, concise list of the main components. Use either comma-separated values or each component on a new line.
    *   For each component, try to specify its type (e.g., Frontend, API, Database, Cache, Message Queue, Service, External System, Load Balancer, CDN).
        Example: "React Web App (Frontend), API Gateway (API), Authentication Microservice (Service), PostgreSQL User DB (Database), Redis Cache (Cache), Payment API (External System)"
    *   This list will be directly used to generate a visual diagram, so clarity and structure are essential. Think about how these components would typically connect.
    *   Consider standard architectural patterns (e.g., microservices, monolithic, event-driven) and choose one that fits the project description. If microservices, list the key microservices.
    *   Think about scalability, reliability, security, and maintainability.

2.  **Explanation (explanation)**:
    *   Clearly explain the reasoning behind your refined design.
    *   Detail any significant changes from the initial design (if provided) and why they were made.
    *   Justify your choice of components and their types.
    *   Briefly discuss how the proposed architecture addresses the key requirements from the project description (e.g., scalability, security).
    *   Mention any important considerations or potential trade-offs.

Focus on providing a practical and well-reasoned architecture. The "refinedArchitectureDesign" should be a clean list ready for diagramming.
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
    // Zod validation on output should ideally handle this, but this is an extra safeguard.
    return {
      refinedArchitectureDesign: output.refinedArchitectureDesign || '',
      explanation: output.explanation || '',
    };
  }
);
