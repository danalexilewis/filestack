import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MonacoBlockComponent from '../components/MonacoBlock/MonacoBlock';

/**
 * Monaco Block Extension - Defines a custom TipTap node for Monaco editors
 * 
 * This extension tells TipTap how to:
 * - Parse Monaco blocks from HTML
 * - Render Monaco blocks to HTML
 * - Handle Monaco blocks in the editor
 * - Create React components for Monaco blocks
 */
const MonacoBlock = Node.create({
  name: 'monacoBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  
  // Define the attributes this node can have
  addAttributes() {
    return {
      file: {
        default: null,
      },
      language: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  // Tell TipTap how to parse this node from HTML
  parseHTML() {
    return [
      {
        tag: 'div[data-monaco-block]',
      },
    ]
  },

  // Tell TipTap how to render this node to HTML
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-monaco-block': 'true' })]
  },

  // Tell TipTap to use our React component
  addNodeView() {
    return ReactNodeViewRenderer(MonacoBlockComponent);
  },
});

export default MonacoBlock; 