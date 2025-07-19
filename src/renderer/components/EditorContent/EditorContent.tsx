import React from 'react';
import { EditorContent as TipTapEditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/react';

interface EditorContentProps {
  editor: Editor | null;
}

/**
 * Editor Content Component
 * 
 * Wraps the TipTap editor content with proper styling and layout.
 */
const EditorContent: React.FC<EditorContentProps> = ({ editor }) => {
  if (!editor) {
    return (
      <div className="flex-1 overflow-y-auto relative">
        <div className="p-5">
          <div className="border border-gray-300 rounded-lg bg-white shadow-sm p-8 text-center text-gray-500">
            Editor not initialized
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="p-5">
        <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
          <TipTapEditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default EditorContent; 