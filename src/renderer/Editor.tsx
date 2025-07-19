import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import * as monaco from 'monaco-editor';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes, Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import { createRoot } from 'react-dom/client';
import { SlashCommand } from '../components/SlashCommand';

// ============================================================================
// MONACO BLOCK COMPONENT
// ============================================================================
// This component renders a Monaco editor within a TipTap block.
// It handles:
// - File editing with Monaco editor
// - Unsaved changes tracking
// - Save functionality
// - Focus and selection management
// ============================================================================

/**
 * Monaco Block Component - Renders a Monaco editor within a TipTap block
 * 
 * This is a complex component that integrates Monaco editor with TipTap.
 * Key concepts to understand:
 * - NodeViewProps: TipTap provides these props to custom node components
 * - Monaco editor lifecycle: creation, focus, content changes, disposal
 * - State management: tracking unsaved changes vs saved content
 * - Selection sync: keeping TipTap and Monaco selection in sync
 */
const MonacoBlockComponent: React.FC<NodeViewProps> = ({ 
  node,           // The TipTap node containing our data
  editor,         // The TipTap editor instance
  getPos,         // Function to get the position of this node in the document
  selected,       // Whether this node is currently selected in TipTap
  updateAttributes // Function to update node attributes
}) => {
  // ============================================================================
  // STATE AND REFS
  // ============================================================================
  
  // Get data from our global store
  const { 
    fileContents,        // Saved file contents (from disk)
    unsavedChanges,      // Unsaved changes (in memory only)
    setUnsavedChanges,   // Function to save changes to unsavedChanges
    saveFile,           // Function to save unsaved changes to disk
    markFileAsDirty     // Function to mark file as needing save
  } = useStore();
  
  // Refs to track component state
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);  // Monaco editor instance
  const containerRef = useRef<HTMLDivElement>(null);                           // DOM container for Monaco
  const isInitializingRef = useRef(false);                                     // Prevent multiple initializations
  const isUpdatingFromEditorRef = useRef(false);                               // Prevent infinite loops
  
  // Extract data from the TipTap node
  const file = node.attrs.file;        // File path (e.g., "src/main.ts")
  const language = node.attrs.language; // Programming language (e.g., "typescript")
  const title = node.attrs.title;       // Display title (e.g., "Main TypeScript File")
  
  // Get current unsaved changes for this specific file
  const currentUnsavedChanges = unsavedChanges[file];
  
  // TipTap selection state (whether this block is selected)
  const isSelected = selected;
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handle save button click
   * 
   * When user clicks "Save", we move the unsaved changes to the saved file contents.
   * This simulates writing the file to disk.
   */
  const handleSave = () => {
    if (editorRef.current) {
      saveFile(file);
    }
  };
  
  /**
   * Handle block click
   * 
   * When user clicks on the block container, we tell TipTap to select this node.
   * This enables editing mode for the Monaco editor.
   */
  const handleClick = () => {
    // Only set selection if we're not already selected (prevents cursor reset)
    if (!isSelected && getPos && editor) {
      editor.commands.setNodeSelection(getPos());
    }
  };
  
  /**
   * Handle keyboard events on the block container
   * 
   * This prevents TipTap from interfering with Monaco editor keyboard handling.
   * For example, when Monaco is focused, we don't want TipTap to handle Enter/Escape.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // If Monaco is focused, let Monaco handle all keyboard events
    if (editorRef.current && editorRef.current.hasWidgetFocus()) {
      return;
    }
    
    // Handle Enter key to select this block
    if (event.key === 'Enter' && !isSelected) {
      event.preventDefault();
      if (getPos && editor) {
        editor.commands.focus();
        editor.commands.setNodeSelection(getPos());
      }
    } 
    // Handle Escape key to deselect this block
    else if (event.key === 'Escape' && isSelected) {
      event.preventDefault();
      if (editor) {
        editor.commands.blur();
      }
    }
  };
  
  /**
   * Handle Monaco editor focus
   * 
   * When Monaco gets focus, we need to tell TipTap to select this node.
   * This keeps the selection state in sync between Monaco and TipTap.
   */
  const handleMonacoFocus = () => {
    if (getPos && editor && !isSelected) {
      // Small delay to ensure Monaco is actually focused
      setTimeout(() => {
        if (editorRef.current && editorRef.current.hasWidgetFocus() && !isSelected) {
          editor.commands.setNodeSelection(getPos());
        }
      }, 10);
    }
  };
  
  /**
   * Handle Monaco editor blur
   * 
   * When Monaco loses focus, we clear the TipTap selection.
   * This keeps the selection state in sync.
   */
  const handleMonacoBlur = () => {
    if (getPos && editor && isSelected) {
      // Small delay to allow for proper focus handling
      setTimeout(() => {
        if (editor && !editorRef.current?.hasWidgetFocus()) {
          editor.commands.blur();
        }
      }, 10);
    }
  };
  
  // ============================================================================
  // MONACO EDITOR LIFECYCLE
  // ============================================================================
  
  /**
   * Effect to sync Monaco read-only state with TipTap selection
   * 
   * When the block is selected, Monaco should be editable.
   * When the block is not selected, Monaco should be read-only.
   */
  useEffect(() => {
    if (editorRef.current) {
      // Update read-only state without recreating the editor
      editorRef.current.updateOptions({ readOnly: !isSelected });
      
      // When block becomes selected, focus the Monaco editor
      if (isSelected) {
        setTimeout(() => {
          if (editorRef.current && isSelected) {
            editorRef.current.focus();
          }
        }, 50);
      }
    }
  }, [isSelected]);
  
  /**
   * Main effect to create and manage the Monaco editor
   * 
   * This is the most complex part of the component. It handles:
   * - Creating the Monaco editor
   * - Setting up content and language
   * - Managing editor lifecycle (focus, blur, content changes)
   * - Cleaning up when component unmounts
   */
  useEffect(() => {
    // ============================================================================
    // VALIDATION - Check if we can create an editor
    // ============================================================================
    
    // We need a container element to mount Monaco
    if (!containerRef.current) {
      return;
    }
    
    // We need file and language information
    if (!file || !language) {
      return;
    }
    
    // We need file contents to be loaded
    if (fileContents[file] === undefined) {
      return;
    }
    
    // Don't recreate editor if the change came from this editor itself
    // This prevents infinite loops when content changes
    if (isUpdatingFromEditorRef.current) {
      return;
    }
    
    // ============================================================================
    // EDITOR CREATION
    // ============================================================================
    
    // Mark that we're starting initialization
    isInitializingRef.current = true;
    
    // Use requestAnimationFrame to ensure DOM is ready
    const frameId = requestAnimationFrame(() => {
      // Double-check container is still available
      if (!containerRef.current) {
        return;
      }
      
      try {
        // ============================================================================
        // MONACO MODEL MANAGEMENT
        // ============================================================================
        // Monaco uses "models" to represent file content. Each model can be shared
        // between multiple editors (useful for split views, etc.)
        
        // Create a unique URI for this file
        const modelUri = monaco.Uri.parse(`inmemory://${file}`);
        
        // Try to reuse existing model, or create a new one
        let model = monaco.editor.getModel(modelUri);
        if (model) {
          // Model exists - update its content if needed
          const currentValue = model.getValue();
          if (currentValue !== currentContent) {
            model.setValue(currentContent || '');
          }
          
          // Check if model is already attached to other editors (this is fine)
          const attachedEditors = monaco.editor.getEditors().filter(editor => editor.getModel() === model);
          // Monaco handles multiple editors on the same model automatically
        } else {
          // Create new model with file content
          model = monaco.editor.createModel(
            currentContent || '',
            language,
            modelUri
          );
        }
        
        // ============================================================================
        // MONACO EDITOR CREATION
        // ============================================================================
        
        // Create the Monaco editor with our model
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
          readOnly: !isSelected, // Initial read-only state
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: false,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          fixedOverflowWidgets: true,
          mouseWheelScrollSensitivity: 0,
          fastScrollSensitivity: 0,
        });
        
        // Set initial read-only state
        monacoEditor.updateOptions({ readOnly: !isSelected });
        
        // ============================================================================
        // DYNAMIC HEIGHT ADJUSTMENT
        // ============================================================================
        // Monaco doesn't auto-resize, so we need to adjust height based on content
        
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
        
        // Adjust height initially and when content changes
        setTimeout(adjustEditorHeight, 10);
        const contentChangeDisposable = monacoEditor.onDidChangeModelContent(() => {
          adjustEditorHeight();
        });
        
        // ============================================================================
        // SCROLL EVENT HANDLING
        // ============================================================================
        // When Monaco scrolls, we want to scroll the parent container too
        
        const scrollDisposable = monacoEditor.onDidScrollChange((e) => {
          if (containerRef.current?.parentElement) {
            const scrollEvent = new WheelEvent('wheel', {
              deltaY: e.scrollTop > 0 ? 1 : -1,
              bubbles: true,
              cancelable: true,
            });
            containerRef.current.parentElement.dispatchEvent(scrollEvent);
          }
        });
        
        // Also handle direct wheel events on Monaco's DOM
        const handleMonacoWheel = (e: WheelEvent) => {
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
        
        // Add wheel event listeners to Monaco's DOM elements
        const monacoDomElement = monacoEditor.getDomNode();
        if (monacoDomElement) {
          monacoDomElement.addEventListener('wheel', handleMonacoWheel, { passive: false, capture: true });
          
          const scrollableElement = monacoDomElement.querySelector('.monaco-scrollable-element');
          if (scrollableElement) {
            scrollableElement.addEventListener('wheel', handleMonacoWheel, { passive: false, capture: true });
          }
        }
        
        // ============================================================================
        // CONTENT CHANGE TRACKING
        // ============================================================================
        // This is the core functionality - track when user makes changes
        
        const changeDisposable = monacoEditor.onDidChangeModelContent(() => {
          // Only track changes when Monaco has focus (user is actually typing)
          if (monacoEditor.hasWidgetFocus()) {
            const newValue = monacoEditor.getValue();
            
            // Set flag to prevent editor recreation
            isUpdatingFromEditorRef.current = true;
            setUnsavedChanges(file, newValue);
            
            // Reset flag after a short delay
            setTimeout(() => {
              isUpdatingFromEditorRef.current = false;
            }, 100);
          }
        });
        
        // ============================================================================
        // FOCUS/BLUR EVENT HANDLING
        // ============================================================================
        
        const focusDisposable = monacoEditor.onDidFocusEditorWidget(() => {
          // Only handle focus if we're not already selected
          if (!isSelected) {
            handleMonacoFocus();
          }
        });
        
        const blurDisposable = monacoEditor.onDidBlurEditorWidget(() => {
          handleMonacoBlur();
        });
        
        // ============================================================================
        // FINAL SETUP
        // ============================================================================
        
        // Store reference to the editor
        editorRef.current = monacoEditor;
        
        // Mark initialization as complete
        setTimeout(() => {
          isInitializingRef.current = false;
        }, 100);
        
        // ============================================================================
        // CLEANUP FUNCTION
        // ============================================================================
        // This function runs when the effect is cleaned up (component unmounts, dependencies change)
        
        return () => {
          // Dispose all Monaco event listeners
          changeDisposable.dispose();
          focusDisposable.dispose();
          blurDisposable.dispose();
          contentChangeDisposable.dispose();
          scrollDisposable.dispose();
          
          // Remove wheel event listeners
          const monacoDomElement = monacoEditor.getDomNode();
          if (monacoDomElement) {
            monacoDomElement.removeEventListener('wheel', handleMonacoWheel, { capture: true });
            
            const scrollableElement = monacoDomElement.querySelector('.monaco-scrollable-element');
            if (scrollableElement) {
              scrollableElement.removeEventListener('wheel', handleMonacoWheel, { capture: true });
            }
          }
          
          // Dispose the editor (but keep the model for reuse)
          monacoEditor.dispose();
        };
        
      } catch (error) {
        console.error('Error creating Monaco editor for:', file, error);
      }
    });
    
    // Cleanup function for the effect
    return () => {
      cancelAnimationFrame(frameId);
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [file, language, fileContents[file]]); // Recreate when file, language, or file contents change
  
  // ============================================================================
  // COMPONENT CLEANUP
  // ============================================================================
  
  // Cleanup effect to dispose editor when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [file]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Validate required props
  if (!file || !language) {
    return <NodeViewWrapper>Invalid Monaco block</NodeViewWrapper>;
  }
  
  // Prepare display data
  const displayTitle = title || `${file} (${language})`;
  const isContentLoaded = fileContents[file] !== undefined;
  
  // Use unsaved changes if available, otherwise use saved file contents
  const currentContent = unsavedChanges[file] !== undefined ? unsavedChanges[file] : fileContents[file];
  
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
        tabIndex={0}
        role="button"
        aria-label={`Click to edit ${displayTitle}`}
      >
        {/* ============================================================================
            HEADER BAR
            ============================================================================
            Shows file title, path, status indicators, and save button
        */}
        <div 
          className={`
            px-3 py-2 border-b border-gray-300 text-sm font-bold
            flex justify-between items-center transition-colors duration-200 ease-in-out
            ${isSelected 
              ? 'bg-blue-50 text-gray-800' 
              : 'bg-gray-100 text-gray-700'
            }
          `}
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #d1d5db',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'colors 0.2s ease-in-out',
            backgroundColor: isSelected ? '#eff6ff' : '#f3f4f6',
            color: isSelected ? '#1f2937' : '#374151',
            position: 'relative'
          }}
        >
          {/* File title and path */}
          <div className="flex flex-row" style={{ display: 'flex', flexDirection: 'row' }}>
            <span>{displayTitle}</span>
            <span 
              className="text-xs text-gray-500 font-normal"
              style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                fontWeight: 'normal',
                marginLeft: '0.25rem'
              }}
            >
              &nbsp;- {file}
            </span>
          </div>
          
          {/* Status indicators and save button */}
          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Show save button only when there are unsaved changes */}
            {currentUnsavedChanges !== undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded px-2 py-1 text-xs cursor-pointer font-bold transition-colors duration-200"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s'
                }}
              >
                Save
              </button>
            )}
          </div>
          
          {/* Status dot - shows save state */}
          <div 
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentUnsavedChanges !== undefined ? '#f97316' : '#10b981', // Orange for unsaved, green for saved
              border: '1px solid white',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
            }}
            title={`Status: ${currentUnsavedChanges !== undefined ? 'Unsaved changes' : 'Saved'}`}
          />
        </div>
        
        {/* ============================================================================
            MONACO EDITOR CONTAINER
            ============================================================================
            This div will be replaced by the Monaco editor
        */}
        <div 
          ref={containerRef}
          className="min-h-[200px] w-full transition-height duration-200 ease-in-out"
        />
        
        {/* Loading indicator */}
        {!isContentLoaded && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
            Loading file content...
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ============================================================================
// TIPTAP NODE EXTENSIONS
// ============================================================================

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

/**
 * Slash Commands Extension - Provides slash command functionality
 * 
 * This extension shows a command menu when the user types '/' at the beginning of a line.
 * It uses TipTap's suggestion system to handle the UI and interactions.
 */
const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        
        // What to do when a command is selected
        command: ({ editor, range, props }) => {
          // Delete the trigger character and replace with the selected command
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(props.command)
            .run()
        },
        
        // Available commands
        items: ({ query }) => {
          const commands = [
            { title: 'Heading', command: '<h1>Heading</h1>' },
            { title: 'Subheading', command: '<h2>Subheading</h2>' },
            { title: 'Bullet List', command: '<ul><li>List item</li></ul>' },
            { title: 'Code Block', command: '<pre><code>Code block</code></pre>' },
            { title: 'Monaco Editor', command: 'monaco' },
          ]
          
          // Filter commands based on user input
          if (query) {
            return commands.filter(item => 
              item.title.toLowerCase().includes(query.toLowerCase())
            )
          }
          
          return commands
        },
        
        // How to render the command menu
        render: () => {
          let popup: any
          let selectedIndex = 0
          let root: any

          return {
            // When slash command starts
            onStart: (props) => {
              // Create popup element
              popup = document.createElement('div')
              popup.className = 'slash-command-popup'
              
              // Calculate position based on cursor
              const { range } = props
              const coords = props.editor.view.coordsAtPos(range.from)
              
              popup.style.cssText = `
                position: fixed;
                z-index: 9999;
                left: ${coords.left}px;
                top: ${coords.bottom + 10}px;
              `
              document.body.appendChild(popup)
              
              // Create React root and render component
              root = createRoot(popup)
              root.render(
                <SlashCommand
                  items={props.items}
                  selectedIndex={selectedIndex}
                  onSelect={(command) => {
                    props.command({ editor: props.editor, range: props.range, props: { command } })
                  }}
                  query={props.query}
                />
              )
            },
            
            // When slash command updates (user types more)
            onUpdate: (props) => {
              if (root) {
                root.render(
                  <SlashCommand
                    items={props.items}
                    selectedIndex={selectedIndex}
                    onSelect={(command) => {
                      props.command({ editor: props.editor, range: props.range, props: { command } })
                    }}
                    query={props.query}
                  />
                )
              }
            },
            
            // Handle keyboard navigation
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                props.event.preventDefault()
                return true
              }
              if (props.event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % (props as any).items.length
                if (root) {
                  root.render(
                    <SlashCommand
                      items={(props as any).items}
                      selectedIndex={selectedIndex}
                      onSelect={(command) => {
                        (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command } })
                      }}
                      query={(props as any).query}
                    />
                  )
                }
                return true
              }
              if (props.event.key === 'ArrowUp') {
                selectedIndex = selectedIndex === 0 
                  ? (props as any).items.length - 1 
                  : selectedIndex - 1
                if (root) {
                  root.render(
                    <SlashCommand
                      items={(props as any).items}
                      selectedIndex={selectedIndex}
                      onSelect={(command) => {
                        (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command } })
                      }}
                      query={(props as any).query}
                    />
                  )
                }
                return true
              }
              if (props.event.key === 'Enter') {
                const item = (props as any).items[selectedIndex]
                if (item) {
                  (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command: item.command } })
                }
                return true
              }
              return false
            },
            
            // When slash command ends
            onExit: () => {
              if (root) {
                root.unmount()
              }
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup)
              }
            },
          }
        },
      }),
    ]
  },
})

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

/**
 * Main Editor Component - Renders the TipTap editor with Monaco blocks
 * 
 * This is the main component that:
 * - Manages the TipTap editor instance
 * - Handles view switching and content loading
 * - Provides the save all functionality
 * - Configures Monaco for different file types
 */
const Editor = () => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  // Get data and functions from our global store
  const { 
    activeView,      // Currently selected view
    views,           // All available views
    fileContents,    // Saved file contents
    unsavedChanges,  // Unsaved changes
    saveAllFiles     // Function to save all files
  } = useStore();
  
  // Track the current view to detect changes
  const currentViewRef = useRef<string | null>(null);
  
  // Find the current view object
  const currentView = views.find(view => view.title === activeView);
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Get Monaco language identifier from file extension
   * 
   * Monaco needs to know what language a file is written in to provide
   * proper syntax highlighting and IntelliSense.
   */
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
  
  /**
   * Configure Monaco editor for test files with Jest globals
   * 
   * This adds TypeScript definitions for Jest functions like describe, it, expect, etc.
   * so that Monaco can provide proper IntelliSense in test files.
   */
  const configureMonacoForTestFiles = () => {
    // Add Jest globals to TypeScript
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

    // Configure TypeScript compiler options
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
  
  // ============================================================================
  // TIPTAP EDITOR CONFIGURATION
  // ============================================================================
  
  // Create and configure the TipTap editor
  const editor = useEditor({
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
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Initialize content when view changes or file contents update
  useEffect(() => {
    if (currentView && currentView.title !== currentViewRef.current) {
      currentViewRef.current = currentView.title;
      
      if (editor && currentView.content) {
        // Build content array for TipTap from the view's content definition
        const contentArray: any[] = [];
        
        currentView.content.forEach((item, index) => {
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
        
        // Set the content in TipTap
        editor.commands.setContent(contentArray);
        
      } else if (editor) {
        // Fallback: create content from file list
        editor.commands.clearContent();
        
        // Add heading
        editor.chain().focus().insertContent(`<h1>${currentView.title}</h1>`).run();
        
        // Add description
        editor.chain().focus().insertContent(`<p>This view contains ${currentView.files.length} files related to ${currentView.title.toLowerCase()}.</p>`).run();
        
        // Add Monaco blocks for each file
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
      }
    }
  }, [currentView, fileContents, editor]);
  
  // Configure Monaco for test files on component mount
  useEffect(() => {
    configureMonacoForTestFiles();
  }, []);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Show placeholder if no view is selected
  if (!activeView || !currentView) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-semibold text-gray-800">Select a view from the sidebar to start editing</h2>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with view title and save all button */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{currentView.title}</h2>
          {Object.keys(unsavedChanges).length > 0 && (
            <button
              onClick={saveAllFiles}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Save All ({Object.keys(unsavedChanges).length} files)
            </button>
          )}
        </div>
      </div>
      
      {/* Main editor area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="p-5">
          <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor; 