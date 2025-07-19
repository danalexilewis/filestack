import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import MonacoBlock from '../extensions/MonacoBlock';
import SlashCommands from '../extensions/SlashCommands';

/**
 * Custom hook for TipTap editor configuration
 * 
 * This hook creates and configures the TipTap editor with all necessary extensions
 * including our custom Monaco blocks and slash commands.
 */
export const useTipTapEditor = () => {
  return useEditor({
    extensions: [
      // Basic editor features
      StarterKit.configure({
        codeBlock: false, // We'll use our own Monaco blocks instead
      }),
      
      // Code block support (for non-Monaco code)
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'monaco-code-block',
        },
      }),
      
      // Our custom Monaco block extension
      MonacoBlock,
      
      // Slash commands
      SlashCommands,
      
      // Placeholder text
      Placeholder.configure({
        placeholder: 'Type / to see commands...',
      }),
    ],
    
    // Initial content (empty)
    content: '',
    
    // Handle content updates
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      console.log('Content updated:', content);
    },
    
    // Editor styling
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });
}; 