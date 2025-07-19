import { View } from '../../shared/types';
import { getLanguageFromFile } from './monaco';

/**
 * Build TipTap content array from view definition
 * 
 * This function converts a view's content definition into a format that TipTap can understand.
 * It handles different content types like headings, paragraphs, Monaco blocks, and lists.
 */
export const buildContentFromView = (currentView: View): any[] => {
  const contentArray: any[] = [];
  
  currentView.content?.forEach((item) => {
    switch (item.type) {
      case 'heading':
        contentArray.push({
          type: 'heading',
          attrs: { level: item.level },
          content: [{ type: 'text', text: item.text }]
        });
        break;
      case 'paragraph':
        contentArray.push({
          type: 'paragraph',
          content: [{ type: 'text', text: item.text }]
        });
        break;
      case 'monaco':
        contentArray.push({
          type: 'monacoBlock',
          attrs: {
            file: item.file,
            language: item.language,
            title: item.title,
          }
        });
        break;
      case 'list': {
        contentArray.push({
          type: 'bulletList',
          content: item.items.map(item => ({
            type: 'listItem',
            content: [{ type: 'text', text: item }]
          }))
        });
        break;
      }
    }
  });
  
  return contentArray;
};

/**
 * Build fallback content from file list
 * 
 * When a view doesn't have a content definition, we create a basic structure
 * with a heading, description, and Monaco blocks for each file.
 */
export const buildFallbackContent = (currentView: View): any[] => {
  const contentArray: any[] = [];
  
  // Add heading
  contentArray.push({
    type: 'heading',
    attrs: { level: 1 },
    content: [{ type: 'text', text: currentView.title }]
  });
  
  // Add description
  contentArray.push({
    type: 'paragraph',
    content: [{ 
      type: 'text', 
      text: `This view contains ${currentView.files.length} files related to ${currentView.title.toLowerCase()}.` 
    }]
  });
  
  // Add Monaco blocks for each file
  currentView.files.forEach((file) => {
    contentArray.push({
      type: 'monacoBlock',
      attrs: {
        file: file,
        language: getLanguageFromFile(file),
        title: `${file} Editor`,
      },
    });
  });
  
  return contentArray;
}; 