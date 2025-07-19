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
    // When Monaco loses focus, ensure TipTap selection is cleared
    if (getPos && editor && isSelected) {
      // Use a small delay to allow for proper focus handling
      setTimeout(() => {
        if (editor && !editorRef.current?.hasWidgetFocus()) {
          editor.commands.blur();
        }
      }, 10);
    }
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
          
          // Check if the model is already attached to another editor
          const attachedEditors = monaco.editor.getEditors().filter(editor => editor.getModel() === model);
          if (attachedEditors.length > 0) {
            console.log(`Model for ${file} is already attached to ${attachedEditors.length} editor(s)`);
            // We can still reuse the model, Monaco handles multiple editors on the same model
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
            horizontal: 'hidden',
          },
          overviewRulerLanes: 0,
          readOnly: !isSelected,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: false,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          // Dynamic height settings
          fixedOverflowWidgets: true,
          // Allow scroll events to bubble up
          mouseWheelScrollSensitivity: 0,
          fastScrollSensitivity: 0,
        });

        // Ensure the editor is properly configured for editing
        console.log(`Editor created with readOnly: ${!isSelected} for ${file}`);
        
        // Set initial read-only state
        monacoEditor.updateOptions({ readOnly: !isSelected });
        
        // Function to adjust editor height based on content
        const adjustEditorHeight = () => {
          if (containerRef.current && monacoEditor) {
            const lineCount = monacoEditor.getModel()?.getLineCount() || 1;
            const lineHeight = monacoEditor.getOption(monaco.editor.EditorOption.lineHeight);
            const padding = 20; // Account for padding and borders
            const minHeight = 200;
            const calculatedHeight = Math.max(minHeight, (lineCount * lineHeight) + padding);
            
            containerRef.current.style.height = `${calculatedHeight}px`;
            monacoEditor.layout();
          }
        };
        
        // Adjust height initially
        setTimeout(adjustEditorHeight, 10);
        
        // Adjust height when content changes
        const contentChangeDisposable = monacoEditor.onDidChangeModelContent(() => {
          adjustEditorHeight();
        });
        
        // Handle Monaco scroll events using Monaco's built-in scroll event
        const scrollDisposable = monacoEditor.onDidScrollChange((e) => {
          console.log(`Monaco scroll change for ${file}:`, e);
          // When Monaco scrolls, also scroll the parent
          if (containerRef.current?.parentElement) {
            const scrollEvent = new WheelEvent('wheel', {
              deltaY: e.scrollTop > 0 ? 1 : -1, // Simple direction indicator
              bubbles: true,
              cancelable: true,
            });
            containerRef.current.parentElement.dispatchEvent(scrollEvent);
          }
        });
        
        // Note: Monaco doesn't have onMouseWheel, using DOM wheel events instead
        
        // Also add wheel event listener to Monaco's DOM for direct wheel events
        const handleMonacoWheel = (e: WheelEvent) => {
          console.log(`Direct wheel event for ${file}:`, e);
          // Bubble wheel events up to parent components
          e.stopPropagation();
          const newEvent = new WheelEvent('wheel', {
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            bubbles: true,
            cancelable: true,
          });
          containerRef.current?.parentElement?.dispatchEvent(newEvent);
        };
        
        const monacoDomElement = monacoEditor.getDomNode();
        if (monacoDomElement) {
          // Use capture phase to intercept events before Monaco processes them
          monacoDomElement.addEventListener('wheel', handleMonacoWheel, { passive: false, capture: true });
          
          // Also add to the scrollable element inside Monaco
          const scrollableElement = monacoDomElement.querySelector('.monaco-scrollable-element');
          if (scrollableElement) {
            scrollableElement.addEventListener('wheel', handleMonacoWheel, { passive: false, capture: true });
          }
        }
        
        if (isSelected) {
          // Force focus and ensure editing is enabled
          setTimeout(() => {
            if (monacoEditor && isSelected) {
              monacoEditor.focus();
              monacoEditor.updateOptions({ readOnly: false });
              // Ensure cursor is visible
              monacoEditor.setPosition(monacoEditor.getPosition());
            }
          }, 50);
        }

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
          contentChangeDisposable.dispose();
          
          // Remove scroll event listeners
          scrollDisposable.dispose();
          const monacoDomElement = monacoEditor.getDomNode();
          if (monacoDomElement) {
            monacoDomElement.removeEventListener('wheel', handleMonacoWheel, { capture: true });
            
            // Also remove from scrollable element
            const scrollableElement = monacoDomElement.querySelector('.monaco-scrollable-element');
            if (scrollableElement) {
              scrollableElement.removeEventListener('wheel', handleMonacoWheel, { capture: true });
            }
          }
          
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
  }, [file, language, fileContents[file], isSelected]); // Recreate when file, language, file contents, or selection changes

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

  // Note: readOnly state is now handled in the main editor creation effect
  // since we recreate the editor when selection changes

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
        className={`
          min-h-[200px] w-full my-2.5 rounded overflow-hidden relative
          border-2 transition-colors duration-200 ease-in-out
          ${isSelected 
            ? 'border-blue-500 bg-gray-900 cursor-text' 
            : 'border-gray-300 bg-gray-900 cursor-pointer hover:border-gray-400'
          }
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        // Scroll events are handled directly by Monaco editor listeners
        tabIndex={0}
        role="button"
        aria-label={`Click to edit ${displayTitle}`}
      >
                <div className={`
          px-3 py-2 border-b border-gray-300 text-sm font-bold
          flex justify-between items-center transition-colors duration-200 ease-in-out
          ${isSelected 
            ? 'bg-blue-50 text-gray-800' 
            : 'bg-gray-100 text-gray-700'
          }
        `}>
          <span>{displayTitle}</span>
          <div className="flex items-center gap-2">
            {isSelected ? (
              <>
                <span className="text-xs text-blue-500 font-normal">
                  Editing
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded px-2 py-1 text-xs cursor-pointer font-bold transition-colors duration-200"
                >
                  Save
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-normal">
                Click to edit
              </span>
            )}
          </div>
        </div>
        <div 
          ref={containerRef}
          className="min-h-[200px] w-full transition-height duration-200 ease-in-out"
        />
        {!isContentLoaded && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
            Loading file content...
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
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const currentView = views.find(view => view.title === activeView);

  // Slash command definitions
  const slashCommands = [
    { key: 'heading', label: 'Heading', desc: 'Add a main heading', icon: 'H', color: 'bg-blue-500' },
    { key: 'subheading', label: 'Subheading', desc: 'Add a subheading', icon: 'H2', color: 'bg-green-500' },
    { key: 'bullet', label: 'Bullet List', desc: 'Add a bullet point', icon: '•', color: 'bg-purple-500' },
    { key: 'code', label: 'Code Block', desc: 'Add a code block', icon: '</>', color: 'bg-orange-500' },
    { key: 'monaco', label: 'Monaco Editor', desc: 'Add a Monaco code editor', icon: '⚡', color: 'bg-red-500' }
  ];

  // Filter commands based on query
  const filteredCommands = slashQuery 
    ? slashCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(slashQuery.toLowerCase())
      )
    : slashCommands;

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

  // Enhanced slash command detection
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSlashMenu) {
        // Handle navigation when menu is open
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => prev === 0 ? filteredCommands.length - 1 : prev - 1);
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          if (filteredCommands[selectedIndex]) {
            handleSlashCommand(filteredCommands[selectedIndex].key);
          }
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setShowSlashMenu(false);
          setSlashQuery('');
          setSelectedIndex(0);
          return;
        }
        if (event.key === 'Backspace' && slashQuery === '') {
          event.preventDefault();
          event.stopPropagation();
          setShowSlashMenu(false);
          setSlashQuery('');
          setSelectedIndex(0);
          return;
        }
        // Handle typing to filter commands
        if (event.key.length === 1 && event.key !== '/') {
          event.preventDefault();
          event.stopPropagation();
          setSlashQuery(prev => prev + event.key);
          setSelectedIndex(0);
          return;
        }
      } else {
        // Handle slash key to open menu
        if (event.key === '/') {
          const { view } = editor;
          const { from } = view.state.selection;
          
          // Check if we're at the beginning of a line
          const $from = view.state.doc.resolve(from);
          const isAtLineStart = $from.parentOffset === 0;
          
          // Also check if we're at the very beginning of the document
          const isAtDocumentStart = from === 0;
          
          // Only show menu if at line start or document start
          if (isAtLineStart || isAtDocumentStart) {
            console.log('Slash detected at line start!');
            const coords = view.coordsAtPos(from);
            
            if (coords) {
              // Get the main content area container
              const mainContentArea = editor.view.dom.closest('.flex-1');
              const containerRect = mainContentArea?.getBoundingClientRect();
              
              if (containerRect) {
                // Calculate position relative to the main content area
                const relativeX = coords.left - containerRect.left;
                const relativeY = coords.bottom - containerRect.top;
                
                console.log('Setting slash position:', { relativeX, relativeY });
                setSlashPosition({ x: relativeX, y: relativeY });
                setShowSlashMenu(true);
                setSlashQuery('');
                setSelectedIndex(0);
              } else {
                // Fallback to absolute positioning
                setSlashPosition({ x: coords.left, y: coords.bottom });
                setShowSlashMenu(true);
                setSlashQuery('');
                setSelectedIndex(0);
              }
            }
          } else {
            console.log('Slash detected but not at line start, ignoring');
          }
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (showSlashMenu && slashMenuRef.current && !slashMenuRef.current.contains(event.target as Element)) {
        setShowSlashMenu(false);
        setSlashQuery('');
        setSelectedIndex(0);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor, showSlashMenu, slashQuery, filteredCommands, selectedIndex]);

  // Handle slash command selection
  const handleSlashCommand = (command: string) => {
    if (!editor) return;

    console.log('Executing command:', command);
    setShowSlashMenu(false);
    setSlashQuery('');
    setSelectedIndex(0);

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
      <div className="p-5">
        <h2 className="text-xl font-semibold text-gray-800">Select a view from the sidebar to start editing</h2>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900">{currentView.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto relative">
        <div className="p-5">
          <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Enhanced slash command menu */}
        {showSlashMenu && (
          <div
            ref={slashMenuRef}
            className="absolute bg-white border-2 border-gray-300 rounded-xl shadow-2xl z-50 min-w-[280px] max-h-[400px] overflow-hidden slash-menu-animate"
                    style={{
            left: slashPosition.x,
            top: slashPosition.y,
            backgroundColor: 'white',
          }}
          >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                /
              </div>
                              <div>
                  <div className="font-semibold text-gray-900 text-sm">Commands</div>
                  <div className="text-xs text-gray-500">
                    {slashQuery ? `Filtering: "${slashQuery}"` : 'Type to filter commands'}
                  </div>
                  {slashQuery && (
                    <div className="text-xs text-blue-600 font-mono mt-1">
                      /{slashQuery}
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Command list */}
          <div className="max-h-[320px] overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.key}
                  onClick={() => handleSlashCommand(cmd.key)}
                  className={`
                    px-4 py-3 cursor-pointer transition-all duration-150 border-l-4
                    ${index === selectedIndex 
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${cmd.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{cmd.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cmd.desc}</div>
                    </div>
                    {index === selectedIndex && (
                      <div className="text-blue-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 text-sm">No commands found</div>
                <div className="text-xs text-gray-300 mt-1">Try a different search term</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>Enter Select</span>
              </div>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Editor; 