import { parseMarkdownToContent, parseMarkdownFile, convertContentToMarkdown } from './markdownParser';

describe('Markdown Parser', () => {
  describe('parseMarkdownToContent', () => {
    it('should parse headings', () => {
      const markdown = '# User Domain\n## User Model';
      const result = parseMarkdownToContent(markdown);
      
      expect(result).toEqual([
        { type: 'heading', level: 1, text: 'User Domain' },
        { type: 'heading', level: 2, text: 'User Model' }
      ]);
    });

    it('should parse paragraphs', () => {
      const markdown = 'This is a paragraph.\n\nThis is another paragraph.';
      const result = parseMarkdownToContent(markdown);
      
      expect(result).toEqual([
        { type: 'paragraph', text: 'This is a paragraph.' },
        { type: 'paragraph', text: 'This is another paragraph.' }
      ]);
    });

    it('should parse lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = parseMarkdownToContent(markdown);
      
      expect(result).toEqual([
        { type: 'list', items: ['Item 1', 'Item 2', 'Item 3'] }
      ]);
    });

    it('should parse Monaco blocks', () => {
      const markdown = '```typescript:user/user.ts\n// User Model\n```';
      const result = parseMarkdownToContent(markdown);
      
      expect(result).toEqual([
        { 
          type: 'monaco', 
          file: 'user/user.ts', 
          language: 'typescript', 
          title: 'user/user.ts Editor' 
        }
      ]);
    });

    it('should parse mixed content', () => {
      const markdown = `# User Domain

This is a paragraph about users.

## User Model

The user interface:

\`\`\`typescript:user/user.ts
// User Model
\`\`\`

## Features

- Authentication
- Profile management
- User preferences`;

      const result = parseMarkdownToContent(markdown);
      
      expect(result).toEqual([
        { type: 'heading', level: 1, text: 'User Domain' },
        { type: 'paragraph', text: 'This is a paragraph about users.' },
        { type: 'heading', level: 2, text: 'User Model' },
        { type: 'paragraph', text: 'The user interface:' },
        { 
          type: 'monaco', 
          file: 'user/user.ts', 
          language: 'typescript', 
          title: 'user/user.ts Editor' 
        },
        { type: 'heading', level: 2, text: 'Features' },
        { type: 'list', items: ['Authentication', 'Profile management', 'User preferences'] }
      ]);
    });
  });

  describe('parseMarkdownFile', () => {
    it('should parse file with front matter', () => {
      const markdown = `---
title: User Domain
files: ["user/user.ts", "user/user.test.ts"]
---

# User Domain

This is the content.`;

      const result = parseMarkdownFile(markdown);
      
      expect(result).toEqual({
        title: 'User Domain',
        files: ['user/user.ts', 'user/user.test.ts'],
        content: [
          { type: 'heading', level: 1, text: 'User Domain' },
          { type: 'paragraph', text: 'This is the content.' }
        ]
      });
    });
  });

  describe('convertContentToMarkdown', () => {
    it('should convert content back to markdown', () => {
      const content = [
        { type: 'heading' as const, level: 1, text: 'User Domain' },
        { type: 'paragraph' as const, text: 'This is a paragraph.' },
        { type: 'list' as const, items: ['Item 1', 'Item 2'] },
        { 
          type: 'monaco' as const, 
          file: 'user/user.ts', 
          language: 'typescript', 
          title: 'User Model' 
        }
      ];

      const result = convertContentToMarkdown(content);
      
      expect(result).toContain('# User Domain');
      expect(result).toContain('This is a paragraph.');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
      expect(result).toContain('```typescript:user/user.ts');
      expect(result).toContain('// User Model');
      expect(result).toContain('```');
    });
  });
}); 