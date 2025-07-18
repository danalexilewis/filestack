import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import * as monaco from 'monaco-editor';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';

interface MonacoBlock {
  id: string;
  file: string;
  language: string;
  content: string;
}

const Editor = () => {
  const { activeView, views, fileContents, setFileContents, markFileAsDirty } = useStore();
  const editorRefs = useRef<Record<string, monaco.editor.IStandaloneCodeEditor>>({});
  const currentViewRef = useRef<string | null>(null);
  const [monacoBlocks, setMonacoBlocks] = useState<MonacoBlock[]>([]);
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

  // Function to update editor height
  const updateEditorHeight = (editor: monaco.editor.IStandaloneCodeEditor, container: HTMLElement) => {
    const contentHeight = editor.getContentHeight();
    const minHeight = 200;
    const maxHeight = 800;
    const height = Math.max(minHeight, Math.min(maxHeight, contentHeight));
    container.style.height = `${height}px`;
    editor.layout();
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
        codeBlock: false, // Disable default code block
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'monaco-code-block',
        },
      }),
      Placeholder.configure({
        placeholder: 'Type / to see commands...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Handle content updates
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
      
      // Create initial content
      const blocks: MonacoBlock[] = [];
      let htmlContent = `<h1>${currentView.title}</h1>`;
      htmlContent += `<p>This view contains ${currentView.files.length} files related to ${currentView.title.toLowerCase()}.</p>`;
      
      // Add Monaco blocks for each file
      currentView.files.forEach((file) => {
        const blockId = `monaco-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        htmlContent += `<div data-monaco-block="true" data-file="${file}" data-language="${getLanguageFromFile(file)}"></div>`;
        
        blocks.push({
          id: blockId,
          file: file,
          language: getLanguageFromFile(file),
          content: fileContents[file] || ''
        });
      });
      
      if (editor) {
        editor.commands.setContent(htmlContent);
        console.log('Set content:', htmlContent);
      }
      setMonacoBlocks(blocks);
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
          const monacoHtml = `<div data-monaco-block="true" data-file="${file}" data-language="${getLanguageFromFile(file)}"></div>`;
          editor.chain().focus().insertContent(monacoHtml).run();
          
          const newBlock: MonacoBlock = {
            id: `monaco-${file.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
            file: file,
            language: getLanguageFromFile(file),
            content: fileContents[file] || ''
          };
          setMonacoBlocks(prev => [...prev, newBlock]);
        }
        break;
    }
  };

  // Render Monaco blocks
  useEffect(() => {
    if (!editor) return;

    console.log('Rendering Monaco blocks, count:', monacoBlocks.length);
    
    const renderMonacoBlocks = () => {
      const monacoElements = document.querySelectorAll('[data-monaco-block]');
      console.log('Found Monaco elements:', monacoElements.length);
      
      monacoElements.forEach((element, index) => {
        const file = element.getAttribute('data-file');
        const language = element.getAttribute('data-language');
        
        console.log(`Element ${index}:`, { file, language });
        
        if (file && language) {
          const block = monacoBlocks.find(b => b.file === file);
          if (block) {
            const containerId = `editor-${block.id}`;
            const container = document.getElementById(containerId);
            
            if (!container) {
              console.log('Creating Monaco editor for:', file);
              
              // Create the Monaco editor container
              const editorContainer = document.createElement('div');
              editorContainer.id = containerId;
              editorContainer.style.minHeight = '200px';
              editorContainer.style.width = '100%';
              editorContainer.style.border = '2px solid #007acc';
              editorContainer.style.marginTop = '10px';
              editorContainer.style.marginBottom = '10px';
              editorContainer.style.borderRadius = '4px';
              editorContainer.style.overflow = 'hidden';
              editorContainer.style.background = '#1e1e1e';
              
              // Add header
              const header = document.createElement('div');
              header.style.padding = '8px 12px';
              header.style.background = '#f5f5f5';
              header.style.borderBottom = '1px solid #ccc';
              header.style.fontSize = '14px';
              header.style.fontWeight = 'bold';
              header.style.color = '#333';
              header.textContent = `${file} (${language})`;
              editorContainer.appendChild(header);
              
              // Add editor div
              const editorDiv = document.createElement('div');
              editorDiv.style.minHeight = '200px';
              editorDiv.style.width = '100%';
              editorContainer.appendChild(editorDiv);
              
              element.appendChild(editorContainer);
              
              // Create Monaco editor
              const monacoEditor = monaco.editor.create(editorDiv, {
                value: block.content,
                language: block.language,
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

              console.log('Monaco editor created for:', file);

              // Set initial height
              updateEditorHeight(monacoEditor, editorDiv);

              // Update height when content changes
              const disposable = monacoEditor.onDidContentSizeChange(() => {
                updateEditorHeight(monacoEditor, editorDiv);
              });

              // Track changes and update store
              const changeDisposable = monacoEditor.onDidChangeModelContent(() => {
                const newValue = monacoEditor.getValue();
                if (newValue !== block.content) {
                  setMonacoBlocks(prev => prev.map(b => 
                    b.id === block.id ? { ...b, content: newValue } : b
                  ));
                  setFileContents(block.file, newValue);
                  markFileAsDirty(block.file);
                }
              });

              editorRefs.current[block.id] = monacoEditor;
            }
          }
        }
      });
    };

    // Render after content is set
    setTimeout(renderMonacoBlocks, 200);
  }, [editor, monacoBlocks, setFileContents, markFileAsDirty]);

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