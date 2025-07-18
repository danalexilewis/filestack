import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import * as monaco from 'monaco-editor';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';

// Simple Monaco Block React Component
const MonacoBlockComponent: React.FC<NodeViewProps> = ({ node }) => {
  const { fileContents, setFileContents, markFileAsDirty } = useStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const file = node.attrs.file;
  const language = node.attrs.language;
  
  useEffect(() => {
    if (!containerRef.current || !file || !language) return;

    console.log('Creating Monaco editor for:', file);
    
    // Use setTimeout to avoid React lifecycle issues
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;
      
      // Create Monaco editor
      const monacoEditor = monaco.editor.create(containerRef.current, {
        value: fileContents[file] || '',
        language: language,
        theme: 'vs-dark',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        scrollbar: {
          vertical: 'hidden',
        },
        overviewRulerLanes: 0,
        readOnly: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
      });

      // Track changes and update store
      const changeDisposable = monacoEditor.onDidChangeModelContent(() => {
        const newValue = monacoEditor.getValue();
        setFileContents(file, newValue);
        markFileAsDirty(file);
      });

      editorRef.current = monacoEditor;

      return () => {
        changeDisposable.dispose();
        monacoEditor.dispose();
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [file, language, fileContents, setFileContents, markFileAsDirty]);

  if (!file || !language) {
    return <NodeViewWrapper>Invalid Monaco block</NodeViewWrapper>;
  }

  return (
    <NodeViewWrapper>
      <div style={{
        minHeight: '200px',
        width: '100%',
        border: '2px solid #007acc',
        marginTop: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#1e1e1e'
      }}>
        <div style={{
          padding: '8px 12px',
          background: '#f5f5f5',
          borderBottom: '1px solid #ccc',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {file} ({language})
        </div>
        <div 
          ref={containerRef}
          style={{
            minHeight: '200px',
            width: '100%'
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

// Simple Monaco Block Extension
const MonacoBlock = Node.create({
  name: 'monacoBlock',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      file: {
        default: null,
      },
      language: {
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

const Editor = () => {
  const { activeView, views, fileContents, setFileContents, markFileAsDirty } = useStore();
  const currentViewRef = useRef<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const currentView = views.find(view => view.title === activeView);

  // Get language from file extension
  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'c':
        return 'c';
      case 'rs':
        return 'rust';
      case 'go':
        return 'go';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'sql':
        return 'sql';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  // Configure Monaco for test files
  const configureMonacoForTestFiles = () => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
      declare global {
        function describe(name: string, fn: () => void): void;
        function it(name: string, fn: () => void): void;
        function test(name: string, fn: () => void): void;
        function expect(value: any): any;
        function beforeEach(fn: () => void): void;
        function afterEach(fn: () => void): void;
        function beforeAll(fn: () => void): void;
        function afterAll(fn: () => void): void;
      }
    `, 'jest-globals.d.ts');

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      noImplicitAny: false,
      sourceMap: true,
      resolveJsonModule: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      types: ['jest', 'node']
    });
  };

  // TipTap editor configuration
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
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      console.log('Content updated:', content);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // Initialize content when view changes
  useEffect(() => {
    if (currentView && currentView.title !== currentViewRef.current) {
      currentViewRef.current = currentView.title;
      
      if (editor) {
        // Clear the editor first
        editor.commands.clearContent();
        
        // Insert the heading
        editor.chain().focus().insertContent(`<h1>${currentView.title}</h1>`).run();
        
        // Insert the description
        editor.chain().focus().insertContent(`<p>This view contains ${currentView.files.length} files related to ${currentView.title.toLowerCase()}.</p>`).run();
        
        // Insert Monaco blocks for each file
        currentView.files.forEach((file) => {
          editor.chain().focus().insertContent({
            type: 'monacoBlock',
            attrs: {
              file: file,
              language: getLanguageFromFile(file),
            },
          }).run();
        });
        
        console.log('Inserted Monaco blocks for files:', currentView.files);
      }
    }
  }, [currentView, fileContents, editor]);

  useEffect(() => {
    configureMonacoForTestFiles();
  }, []);

  // Simple slash command detection
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key);
      
      if (event.key === '/') {
        console.log('Slash detected!');
        const { view } = editor;
        const { from } = view.state.selection;
        const coords = view.coordsAtPos(from);
        
        if (coords) {
          console.log('Setting slash position:', coords);
          setSlashPosition({ x: coords.left, y: coords.bottom });
          setShowSlashMenu(true);
        }
      } else if (event.key === 'Escape') {
        setShowSlashMenu(false);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  // Handle slash command selection
  const handleSlashCommand = (command: string) => {
    if (!editor) return;

    console.log('Executing command:', command);
    setShowSlashMenu(false);

    switch (command) {
      case 'heading':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'subheading':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'monaco':
        if (currentView?.files.length) {
          const file = currentView.files[0];
          
          // Insert Monaco block node
          editor.chain().focus().insertContent({
            type: 'monacoBlock',
            attrs: {
              file: file,
              language: getLanguageFromFile(file),
            },
          }).run();
        }
        break;
    }
  };

  if (!activeView || !currentView) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Select a view from the sidebar to start editing</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>{currentView.title}</h2>
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          minHeight: '400px',
          padding: '20px'
        }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Slash command menu */}
      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          style={{
            position: 'absolute',
            left: slashPosition.x,
            top: slashPosition.y,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '200px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <div style={{ padding: '8px 12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
            Commands
          </div>
          {[
            { key: 'heading', label: 'Heading', desc: 'Add a main heading' },
            { key: 'subheading', label: 'Subheading', desc: 'Add a subheading' },
            { key: 'bullet', label: 'Bullet List', desc: 'Add a bullet point' },
            { key: 'code', label: 'Code Block', desc: 'Add a code block' },
            { key: 'monaco', label: 'Monaco Editor', desc: 'Add a Monaco code editor' }
          ].map(cmd => (
            <div
              key={cmd.key}
              onClick={() => handleSlashCommand(cmd.key)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 'bold' }}>{cmd.label}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{cmd.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Editor; 