
// src/content/config.ts
import { defineCollection, z } from "astro:content";
import { glob } from 'astro/loaders';

export const panels = defineCollection({
  loader: glob({ pattern: '**/*.md', base: "./src/content/panels" }),
  schema: z.object({
    name: z.string(),
  }),
});

export const collections = { panels };
