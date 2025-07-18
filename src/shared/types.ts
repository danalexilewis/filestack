import { z } from 'zod';

export const ContentItemSchema = z.union([
  z.object({
    type: z.literal('heading'),
    level: z.number().min(1).max(6),
    text: z.string(),
  }),
  z.object({
    type: z.literal('paragraph'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('monaco'),
    file: z.string(),
    language: z.string(),
    title: z.string(),
  }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string()),
  }),
]);

export const ViewSchema = z.object({
  title: z.string(),
  files: z.array(z.string()),
  content: z.array(ContentItemSchema).optional(),
});

export const ConfigSchema = z.object({
  views: z.array(ViewSchema),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;
export type View = z.infer<typeof ViewSchema>;
export type Config = z.infer<typeof ConfigSchema>; 