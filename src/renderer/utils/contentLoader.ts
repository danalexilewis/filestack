import { View, ContentItem } from '../../shared/types';
import { parseMarkdownFile } from './markdownParser';
import { useStore } from '../store';
import { validateParsedMarkdown, validateMonacoBlock } from './validation';

/**
 * Load referenced files into the store from content items
 */
const loadReferencedFilesFromContent = async (content: any[], workspacePath: string) => {
  if (!(window as any).electron) {
    console.error('Electron API not available for loading files');
    return;
  }
  
  for (const item of content) {
    if (item.type === 'monaco') {
      try {
        // Validate Monaco block
        const validatedBlock = validateMonacoBlock(item);
        
        const fileContent = await (window as any).electron.loadContentFile(validatedBlock.file);
        if (fileContent) {
          useStore.getState().setFileContents(validatedBlock.file, fileContent);
        } else {
          console.warn(`No content found for file: ${validatedBlock.file}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('validation')) {
          console.error(`Monaco block validation failed:`, error);
        } else {
          console.error(`Error loading file ${item.file}:`, error);
        }
      }
    }
  }
};

/**
 * Convert ContentItem array to TipTap format
 * 
 * This function converts our custom ContentItem format to the format
 * that TipTap expects for its setContent method.
 */
const convertToTipTapFormat = (content: ContentItem[]): any[] => {
  return content.map((item) => {
    switch (item.type) {
      case 'heading':
        return {
          type: 'heading',
          attrs: { level: item.level },
          content: [{ type: 'text', text: item.text }]
        };
        
      case 'paragraph':
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: item.text }]
        };
        
      case 'monaco':
        return {
          type: 'monacoBlock',
          attrs: {
            file: item.file,
            language: item.language,
            title: item.title,
          }
        };
        
      case 'list':
        return {
          type: 'bulletList',
          content: item.items.map(listItem => ({
            type: 'listItem',
            content: [{ type: 'text', text: listItem }]
          }))
        };
        
      default:
        console.warn(`Unknown content type: ${(item as any).type}`);
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Unknown content type' }]
        };
    }
  });
};

/**
 * Load content for a view from its Markdown file
 * 
 * This function loads content from the view's Markdown file path.
 * The order of views in the config determines the rendering order.
 */
export const loadViewContent = async (
  view: View, 
  workspacePath: string
): Promise<ContentItem[]> => {
  try {
    // Check if Electron API is available
    if (!(window as any).electron) {
      console.error('Electron API not available in renderer process');
      throw new Error('Electron API not available');
    }
    
    // Use Electron's IPC to load the content file
    const content = await (window as any).electron.loadContentFile(view.path);
    
    if (content) {
      const parsed = parseMarkdownFile(content);
      
      // Validate parsed content
      try {
        const validatedParsed = validateParsedMarkdown(parsed);
        
        // Load referenced files into the store
        await loadReferencedFilesFromContent(validatedParsed.content, workspacePath);
      } catch (validationError) {
        console.error(`Content validation failed:`, validationError);
        throw new Error(`Content validation failed: ${validationError}`);
      }
      
      // Convert to TipTap format
      const tipTapContent = convertToTipTapFormat(parsed.content);
      return tipTapContent;
    } else {
      console.warn(`Content file not found: ${view.path}`);
      throw new Error(`Content file not found: ${view.path}`);
    }
  } catch (error) {
    console.error(`Failed to load content file ${view.path}:`, error);
    throw error;
  }
};

/**
 * Save content back to a Markdown file
 * 
 * This function saves the current content back to the view's Markdown file.
 * It's used when users edit content in the editor and want to save changes.
 */
export const saveViewContent = async (
  view: View,
  content: ContentItem[],
  workspacePath: string
): Promise<void> => {
  try {
    const { convertViewToMarkdown } = await import('./markdownParser');
    const markdownContent = convertViewToMarkdown(view.title, [], content);
    
    // Use Electron's IPC to save the content file
    const success = await (window as any).electron.saveContentFile(view.path, markdownContent);
    
    if (success) {
      console.log(`Saved content to: ${view.path}`);
    } else {
      throw new Error('Failed to save content file');
    }
  } catch (error) {
    console.error(`Failed to save content file ${view.path}:`, error);
    throw error;
  }
};

/**
 * Check if a view has editable content
 * 
 * All views now have editable content since they all have a path to a Markdown file.
 */
export const hasEditableContent = (view: View): boolean => {
  return true;
};

/**
 * Get the content file path for a view
 */
export const getContentFilePath = (view: View, workspacePath: string): string => {
  return `${workspacePath}/${view.path}`;
}; 