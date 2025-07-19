import { z } from 'zod';

// ============================================================================
// CONTENT ITEM SCHEMAS
// ============================================================================

/**
 * Schema for Monaco block content items
 */
export const MonacoBlockSchema = z.object({
  type: z.literal('monaco'),
  file: z.string().min(1, 'File path is required'),
  language: z.string().min(1, 'Language is required'),
  title: z.string().min(1, 'Title is required'),
});

/**
 * Schema for heading content items
 */
export const HeadingSchema = z.object({
  type: z.literal('heading'),
  level: z.number().int().min(1).max(6, 'Heading level must be between 1 and 6'),
  text: z.string().min(1, 'Heading text is required'),
});

/**
 * Schema for paragraph content items
 */
export const ParagraphSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string().min(1, 'Paragraph text is required'),
});

/**
 * Schema for list content items
 */
export const ListSchema = z.object({
  type: z.literal('list'),
  items: z.array(z.string().min(1, 'List item cannot be empty')).min(1, 'List must have at least one item'),
});

/**
 * Schema for any content item
 */
export const ContentItemSchema = z.discriminatedUnion('type', [
  MonacoBlockSchema,
  HeadingSchema,
  ParagraphSchema,
  ListSchema,
]);

// ============================================================================
// PARSED MARKDOWN SCHEMAS
// ============================================================================

/**
 * Schema for parsed Markdown file structure
 */
export const ParsedMarkdownSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  files: z.array(z.string().min(1, 'File path cannot be empty')),
  content: z.array(ContentItemSchema).min(1, 'Content must have at least one item'),
});

// ============================================================================
// FILE LOADING SCHEMAS
// ============================================================================

/**
 * Schema for file loading response
 */
export const FileLoadResponseSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Schema for Monaco block file reference
 */
export const MonacoFileReferenceSchema = z.object({
  file: z.string().min(1, 'File path is required'),
  language: z.string().min(1, 'Language is required'),
  title: z.string().min(1, 'Title is required'),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a content item
 */
export const validateContentItem = (item: unknown) => {
  try {
    return ContentItemSchema.parse(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      console.error('Content item validation failed:', {
        item,
        errors: zodError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      });
    }
    throw error;
  }
};

/**
 * Validate parsed Markdown content
 */
export const validateParsedMarkdown = (parsed: unknown) => {
  try {
    return ParsedMarkdownSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      console.error('Parsed Markdown validation failed:', {
        parsed,
        errors: zodError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      });
    }
    throw error;
  }
};

/**
 * Validate Monaco block specifically
 */
export const validateMonacoBlock = (block: unknown) => {
  try {
    return MonacoBlockSchema.parse(block);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      console.error('Monaco block validation failed:', {
        block,
        errors: zodError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      });
    }
    throw error;
  }
};

/**
 * Validate file loading response
 */
export const validateFileLoadResponse = (response: unknown) => {
  try {
    return FileLoadResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      console.error('File load response validation failed:', {
        response,
        errors: zodError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      });
    }
    throw error;
  }
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ValidatedContentItem = z.infer<typeof ContentItemSchema>;
export type ValidatedMonacoBlock = z.infer<typeof MonacoBlockSchema>;
export type ValidatedParsedMarkdown = z.infer<typeof ParsedMarkdownSchema>;
export type ValidatedFileLoadResponse = z.infer<typeof FileLoadResponseSchema>; 