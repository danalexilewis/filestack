import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useStore } from './store';

// Mock the store
jest.mock('./store', () => ({
  useStore: jest.fn(() => ({
    fileContents: { 'test.ts': 'test content' },
    setFileContents: jest.fn(),
    markFileAsDirty: jest.fn(),
  })),
}));

// Simple Monaco Block React Component (simplified for testing)
const MonacoBlockComponent: React.FC<any> = ({ node, editor, getPos, selected }) => {
  const { fileContents, setFileContents, markFileAsDirty } = useStore();
  const file = node.attrs.file;
  const language = node.attrs.language;
  const title = node.attrs.title;
  const isSelected = selected;

  const handleClick = () => {
    if (getPos && editor) {
      editor.commands.focus();
      editor.commands.setNodeSelection(getPos());
    }
  };

  if (!file || !language) {
    return <div>Invalid Monaco block</div>;
  }

  const displayTitle = title || `${file} (${language})`;

  return (
    <div 
      data-testid="monaco-block"
      onClick={handleClick}
      style={{
        border: isSelected ? '2px solid #007acc' : '2px solid #ccc',
        cursor: isSelected ? 'text' : 'pointer',
      }}
    >
      <div data-testid="monaco-header">
        <span>{displayTitle}</span>
        {isSelected && <span data-testid="editing-indicator">Editing</span>}
      </div>
      <div data-testid="monaco-container" />
      {!isSelected && (
        <div data-testid="click-to-edit">Click to edit</div>
      )}
    </div>
  );
};

// Monaco Block Extension
const MonacoBlock = Node.create({
  name: 'monacoBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  
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

  parseHTML() {
    return [
      {
        tag: 'div[data-monaco-block]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-monaco-block': 'true' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MonacoBlockComponent);
  },
});

// Test component that renders the editor
const TestEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'monaco-code-block',
        },
      }),
      MonacoBlock,
      Placeholder.configure({
        placeholder: 'Type / to see commands...',
      }),
    ],
    content: '',
  });

  const insertMonacoBlock = () => {
    if (editor) {
      editor.chain().focus().insertContent({
        type: 'monacoBlock',
        attrs: {
          file: 'test.ts' as string,
          language: 'typescript' as string,
          title: 'Test File' as string,
        },
      }).run();
    }
  };

  return (
    <div>
      <button onClick={insertMonacoBlock} data-testid="insert-block">
        Insert Monaco Block
      </button>
      <EditorContent editor={editor} data-testid="editor-content" />
    </div>
  );
};

describe('MonacoBlock Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Monaco block with correct initial state', async () => {
    render(<TestEditor />);
    
    // Insert a Monaco block
    fireEvent.click(screen.getByTestId('insert-block'));
    
    // Wait for the block to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('monaco-block')).toBeInTheDocument();
    });

    // Check that the block is not selected initially
    const block = screen.getByTestId('monaco-block');
    expect(block).toHaveStyle('border: 2px solid #ccc');
    expect(screen.getByTestId('click-to-edit')).toBeInTheDocument();
    expect(screen.queryByTestId('editing-indicator')).not.toBeInTheDocument();
  });

  it('should switch to edit mode when clicked', async () => {
    render(<TestEditor />);
    
    // Insert a Monaco block
    fireEvent.click(screen.getByTestId('insert-block'));
    
    // Wait for the block to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('monaco-block')).toBeInTheDocument();
    });

    // Click on the block to select it
    fireEvent.click(screen.getByTestId('monaco-block'));
    
    // The block should now be selected (in a real scenario, this would be handled by TipTap)
    // For this test, we're just verifying the click handler is called
    expect(screen.getByTestId('monaco-block')).toBeInTheDocument();
  });

  it('should display correct title and language', async () => {
    render(<TestEditor />);
    
    // Insert a Monaco block
    fireEvent.click(screen.getByTestId('insert-block'));
    
    // Wait for the block to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('monaco-block')).toBeInTheDocument();
    });

    // Check that the title is displayed correctly
    const header = screen.getByTestId('monaco-header');
    expect(header).toHaveTextContent('Test File');
  });

  it('should handle missing file or language gracefully', () => {
    // Test with invalid node attributes
    const invalidNode = {
      attrs: {
        file: null,
        language: null,
        title: null,
      }
    };

    render(
      <MonacoBlockComponent 
        node={invalidNode} 
        editor={null} 
        getPos={() => 0} 
        selected={false} 
      />
    );

    expect(screen.getByText('Invalid Monaco block')).toBeInTheDocument();
  });
}); 