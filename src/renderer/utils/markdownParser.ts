import { ContentItem } from '../../shared/types';

/**
 * Parse Markdown content into TipTap-compatible format
 * 
 * This parser handles:
 * - Standard Markdown (headings, paragraphs, lists)
 * - Custom Monaco block syntax: ```language:filepath
 * - Converts to ContentItem format for TipTap
 */
export const parseMarkdownToContent = (markdown: string): ContentItem[] => {
  const lines = markdown.split('\n');
  const content: ContentItem[] = [];
  let currentList: string[] = [];
  let inMonacoBlock = false;
  let monacoBlockInfo: { language: string; file: string; title: string } | null = null;
  let monacoBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle Monaco block start
    if (trimmedLine.startsWith('```') && !inMonacoBlock) {
      const match = trimmedLine.match(/^```(\w+):(.+)$/);
      if (match) {
        inMonacoBlock = true;
        const [, language, file] = match;
        monacoBlockInfo = {
          language,
          file,
          title: `${file} Editor`
        };
        monacoBlockLines = [];
        continue;
      }
    }

    // Handle Monaco block end
    if (trimmedLine === '```' && inMonacoBlock) {
      inMonacoBlock = false;
      if (monacoBlockInfo) {
        content.push({
          type: 'monaco',
          file: monacoBlockInfo.file,
          language: monacoBlockInfo.language,
          title: monacoBlockInfo.title
        });
        monacoBlockInfo = null;
        monacoBlockLines = [];
      }
      continue;
    }

    // Collect Monaco block content (but don't add to content array)
    if (inMonacoBlock) {
      monacoBlockLines.push(line);
      continue;
    }

    // Handle headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      // Flush any pending list
      if (currentList.length > 0) {
        content.push({
          type: 'list',
          items: currentList
        });
        currentList = [];
      }

      const [, hashes, text] = headingMatch;
      const level = hashes.length;
      content.push({
        type: 'heading',
        level,
        text: text.trim()
      });
      continue;
    }

    // Handle list items
    const listMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      currentList.push(listMatch[1].trim());
      continue;
    }

    // Handle regular paragraphs
    if (trimmedLine.length > 0) {
      // Flush any pending list
      if (currentList.length > 0) {
        content.push({
          type: 'list',
          items: currentList
        });
        currentList = [];
      }

      content.push({
        type: 'paragraph',
        text: trimmedLine
      });
    }
  }

  // Flush any remaining list
  if (currentList.length > 0) {
    content.push({
      type: 'list',
      items: currentList
    });
  }

  return content;
};

/**
 * Convert ContentItem array back to Markdown
 * 
 * This is useful for:
 * - Saving content back to Markdown files
 * - Exporting content for external editing
 */
export const convertContentToMarkdown = (content: ContentItem[]): string => {
  const lines: string[] = [];

  content.forEach((item) => {
    switch (item.type) {
      case 'heading': {
        const hashes = '#'.repeat(item.level);
        lines.push(`${hashes} ${item.text}`);
        break;
      }

      case 'paragraph':
        lines.push(item.text);
        break;

      case 'monaco':
        lines.push(`\`\`\`${item.language}:${item.file}`);
        lines.push(`// ${item.title}`);
        lines.push('```');
        break;

      case 'list':
        item.items.forEach(listItem => {
          lines.push(`- ${listItem}`);
        });
        break;
    }
    
    // Add spacing between blocks
    lines.push('');
  });

  return lines.join('\n').trim();
};

/**
 * Parse a complete Markdown file for a view
 * 
 * This function handles the full Markdown file format:
 * ---
 * title: View Title
 * files: ["file1.ts", "file2.ts"]
 * ---
 * 
 * # Content starts here
 * ...
 */
export const parseMarkdownFile = (markdownContent: string): {
  title: string;
  files: string[];
  content: ContentItem[];
} => {
  const lines = markdownContent.split('\n');
  let inFrontMatter = false;
  const frontMatterLines: string[] = [];
  const contentLines: string[] = [];
  let title = '';
  let files: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for front matter start
    if (line.trim() === '---' && !inFrontMatter) {
      inFrontMatter = true;
      continue;
    }

    // Check for front matter end
    if (line.trim() === '---' && inFrontMatter) {
      inFrontMatter = false;
      continue;
    }

    // Collect front matter
    if (inFrontMatter) {
      frontMatterLines.push(line);
      continue;
    }

    // Collect content
    contentLines.push(line);
  }

  // Parse front matter
  frontMatterLines.forEach(fmLine => {
    const [key, ...valueParts] = fmLine.split(':');
    const value = valueParts.join(':').trim();
    
    if (key === 'title') {
      title = value;
    } else if (key === 'files') {
      // Parse array format: ["file1.ts", "file2.ts"]
      try {
        files = JSON.parse(value);
      } catch {
        // Fallback: parse comma-separated format
        files = value.split(',').map(f => f.trim().replace(/['"]/g, ''));
      }
    }
  });

  // Parse content
  const content = parseMarkdownToContent(contentLines.join('\n'));

  return { title, files, content };
};

/**
 * Convert a view back to Markdown file format
 */
export const convertViewToMarkdown = (
  title: string, 
  files: string[], 
  content: ContentItem[]
): string => {
  const frontMatter = [
    '---',
    `title: ${title}`,
    `files: ${JSON.stringify(files)}`,
    '---',
    ''
  ].join('\n');

  const contentMarkdown = convertContentToMarkdown(content);

  return frontMatter + contentMarkdown;
}; 