# Archimedes AI

An AI assistant for refining software architecture designs. Describe your project in plain language, chat with the assistant about trade-offs, and see the proposed architecture rendered visually.

Built with Next.js, Tailwind CSS, shadcn/ui and [Genkit](https://firebase.google.com/docs/genkit) in Firebase Studio.

## Features

- **Architecture refinement**: paste a project description and get a suggested architecture plus concrete edits.
- **Chat interface**: iterate on the design conversationally.
- **Visualisation**: the current architecture is rendered as a diagram that updates as the design changes.

## Getting started

```bash
npm install
npm run dev          # Next.js app on http://localhost:9002
npm run genkit:dev   # Genkit dev UI for the AI flows
```

Set your Google AI API key in `.env.local` before running the Genkit flows:

```
GOOGLE_GENAI_API_KEY=your-key
```

## Project layout

- `src/ai/flows/refine-architecture-design.ts` – the Genkit flow that produces design suggestions
- `src/components/app/architecture-refinement-page.tsx` – main UI
- `docs/blueprint.md` – product and style brief
