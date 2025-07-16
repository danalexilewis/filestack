import { z } from 'zod';

export const ViewSchema = z.object({
  title: z.string(),
  files: z.array(z.string()),
});

export const ConfigSchema = z.object({
  views: z.array(ViewSchema),
});

export type View = z.infer<typeof ViewSchema>;
export type Config = z.infer<typeof ConfigSchema>; 