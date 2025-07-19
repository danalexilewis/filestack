import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import * as monaco from 'monaco-editor';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';

// Simple Monaco Block React Component
const MonacoBlockComponent: React.FC<NodeViewProps> = ({ node, editor, getPos, selected, updateAttributes }) => {
  const { fileContents, setFileContents, markFileAsDirty } = useStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef(false);
  
  const file = node.attrs.file;
  const language = node.attrs.language;
  const title = node.attrs.title;
  
  // Use TipTap's selection state instead of local isEditing
  const isSelected = selected;
  
  const handleSave = () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      setFileContents(file, content);
      markFileAsDirty(file);
      console.log('Saved file:', file);
    }
  };

  const handleClick = () => {
    // Focus the TipTap node when clicked
    if (getPos && editor) {
      editor.commands.focus();
      editor.commands.setNodeSelection(getPos());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !isSelected) {
      event.preventDefault();
      if (getPos && editor) {
        editor.commands.focus();
        editor.commands.setNodeSelection(getPos());
      }
    } else if (event.key === 'Escape' && isSelected) {
      event.preventDefault();
      if (editor) {
        editor.commands.blur();
      }
    }
  };

  // Handle Monaco editor focus/blur to sync with TipTap selection
  const handleMonacoFocus = () => {
    if (getPos && editor && !isSelected) {
      // Use a small delay to ensure Monaco is fully focused before setting TipTap selection
      setTimeout(() => {
        if (editorRef.current) {
          editor.commands.setNodeSelection(getPos());
        }
      }, 10);
    }
  };

  const handleMonacoBlur = () => {
    // Don't immediately deselect - let TipTap handle selection state
    // This prevents flickering when clicking between Monaco and other content
  };

  // Handle when TipTap selection changes to sync Monaco focus
  useEffect(() => {
    if (editorRef.current && isSelected) {
      // When the block becomes selected, focus the Monaco editor
      setTimeout(() => {
        if (editorRef.current && isSelected) {
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [isSelected]);

  useEffect(() => {
    if (!containerRef.current || !file || !language) {
      console.log('Cannot create Monaco editor:', { 
        hasContainer: !!containerRef.current, 
        hasFile: !!file, 
        hasLanguage: !!language 
      });
      return;
    }

    // Wait for file contents to be available
    if (fileContents[file] === undefined) {
      console.log(`Waiting for file contents to load for ${file}`);
      return;
    }

    console.log('Creating Monaco editor for:', file, 'selected:', isSelected, 'content length:', fileContents[file]?.length || 0);
    
    isInitializingRef.current = true;
    
    // Use requestAnimationFrame to ensure DOM is ready
    const frameId = requestAnimationFrame(() => {
      if (!containerRef.current) {
        console.log('Container not ready, retrying...');
        return;
      }
      
      try {
        const modelUri = monaco.Uri.parse(`inmemory://${file}`);
        
        // Check if model already exists and reuse it, or create a new one
        let model = monaco.editor.getModel(modelUri);
        if (model) {
          console.log(`Reusing existing model for ${file}`);
          // Update the model content if it's different
          const currentValue = model.getValue();
          if (currentValue !== fileContents[file]) {
            console.log(`Updating model content for ${file}`);
            model.setValue(fileContents[file] || '');
          }
        } else {
          console.log(`Creating new model for ${file}`);
          // Create Monaco editor with unique model
          model = monaco.editor.createModel(
            fileContents[file] || '',
            language,
            modelUri
          );
        }
        
        const monacoEditor = monaco.editor.create(containerRef.current, {
          model: model,
          theme: 'vs-dark',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          scrollbar: {
            vertical: 'hidden',
          },
          overviewRulerLanes: 0,
          readOnly: !isSelected,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: false,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        });

        console.log('Monaco editor created successfully for:', file, 'readOnly:', !isSelected, 'with content length:', fileContents[file]?.length || 0);

        // Track changes and update store
        const changeDisposable = monacoEditor.onDidChangeModelContent(() => {
          if (isSelected && !isInitializingRef.current) {
            const newValue = monacoEditor.getValue();
            console.log(`Content changed for ${file}:`, newValue.substring(0, 100) + '...');
            setFileContents(file, newValue);
            markFileAsDirty(file);
          }
        });

        // Handle Monaco focus/blur events
        const focusDisposable = monacoEditor.onDidFocusEditorWidget(() => {
          console.log(`Monaco editor focused for ${file}`);
          handleMonacoFocus();
        });
        const blurDisposable = monacoEditor.onDidBlurEditorWidget(() => {
          console.log(`Monaco editor blurred for ${file}`);
          handleMonacoBlur();
        });

        editorRef.current = monacoEditor;
        
        // Mark initialization as complete after a short delay
        setTimeout(() => {
          isInitializingRef.current = false;
          console.log(`Editor initialization complete for ${file}`);
        }, 100);

        return () => {
          console.log(`Disposing Monaco editor for ${file}`);
          changeDisposable.dispose();
          focusDisposable.dispose();
          blurDisposable.dispose();
          monacoEditor.dispose();
          // Don't dispose the model as it might be reused by other editors
          // The model will be cleaned up when the app closes or when explicitly disposed
        };
      } catch (error) {
        console.error('Error creating Monaco editor for:', file, error);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (editorRef.current) {
        console.log(`Cleaning up Monaco editor for ${file}`);
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [file, language, fileContents[file]]); // Recreate when file, language, or file contents change

  // Debug effect to track editor recreation
  useEffect(() => {
    console.log(`Editor recreation triggered for ${file}:`, {
      file,
      language,
      hasContent: fileContents[file] !== undefined,
      contentLength: fileContents[file]?.length || 0
    });
  }, [file, language, fileContents[file]]);

  // No separate content update effect needed - editor is recreated when fileContents change

  // Debug effect to log file contents changes
  useEffect(() => {
    console.log(`File contents changed for ${file}:`, {
      hasContent: fileContents[file] !== undefined,
      contentLength: fileContents[file]?.length || 0,
      contentPreview: fileContents[file]?.substring(0, 50) || 'undefined',
      hasEditor: !!editorRef.current,
      isInitializing: isInitializingRef.current
    });
  }, [fileContents[file], file]);

  // Update readOnly state when selection changes
  useEffect(() => {
    if (editorRef.current) {
      console.log(`Setting readOnly to ${!isSelected} for ${file}`);
      editorRef.current.updateOptions({ readOnly: !isSelected });
    }
  }, [isSelected, file]);

  // Cleanup effect to dispose editor when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        console.log(`Component cleanup: disposing Monaco editor for ${file}`);
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [file]);

  if (!file || !language) {
    return <NodeViewWrapper>Invalid Monaco block</NodeViewWrapper>;
  }

  const displayTitle = title || `${file} (${language})`;
  const isContentLoaded = fileContents[file] !== undefined;

  return (
    <NodeViewWrapper>
      <div 
        style={{
          minHeight: '200px',
          width: '100%',
          border: isSelected ? '2px solid #007acc' : '2px solid #ccc',
          marginTop: '10px',
          marginBottom: '10px',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#1e1e1e',
          cursor: isSelected ? 'text' : 'pointer',
          transition: 'border-color 0.2s ease',
          position: 'relative'
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Click to edit ${displayTitle}`}
      >
        <div style={{
          padding: '8px 12px',
          background: isSelected ? '#e3f2fd' : '#f5f5f5',
          borderBottom: '1px solid #ccc',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.2s ease'
        }}>
          <span>{displayTitle}</span>
          {isSelected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#007acc', fontWeight: 'normal' }}>
                Editing
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                style={{
                  background: '#007acc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#005a9e'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#007acc'}
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div 
          ref={containerRef}
          style={{
            minHeight: '200px',
            width: '100%'
          }}
        />
        {!isContentLoaded && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
            pointerEvents: 'none'
          }}>
            Loading file content...
          </div>
        )}
        {isContentLoaded && !isSelected && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
            pointerEvents: 'none',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}>
            Click to edit
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Simple Monaco Block Extension
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
      
      console.log('Current view:', currentView);
      console.log('Has content:', !!currentView.content);
      console.log('Content length:', currentView.content?.length);
      
      if (editor && currentView.content) {
        console.log('Rendering content from JSON file');
        
        // Build content array for TipTap
        const contentArray: any[] = [];
        
        currentView.content.forEach((item, index) => {
          console.log(`Processing item ${index}:`, item);
          switch (item.type) {
            case 'heading':
              console.log(`Adding heading: h${item.level} - ${item.text}`);
              contentArray.push({
                type: 'heading',
                attrs: { level: item.level },
                content: [{ type: 'text', text: item.text }]
              });
              break;
            case 'paragraph':
              console.log(`Adding paragraph: ${item.text}`);
              contentArray.push({
                type: 'paragraph',
                content: [{ type: 'text', text: item.text }]
              });
              break;
            case 'monaco':
              console.log(`Adding Monaco block: ${item.title} - ${item.file} (${item.language})`);
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
              console.log(`Adding list with ${item.items.length} items`);
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
        
        // Insert all content at once
        editor.commands.setContent(contentArray);
        console.log('Set content array:', contentArray);
      } else if (editor) {
        // Fallback to old behavior if no content is defined
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
              title: `${file} Editor`,
            },
          }).run();
        });
        
        console.log('Inserted fallback content for files:', currentView.files);
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
              title: `${file} Editor`,
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