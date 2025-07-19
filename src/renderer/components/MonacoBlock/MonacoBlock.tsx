import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import * as monaco from 'monaco-editor';
import { useStore } from '../../store';

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

export default MonacoBlockComponent; 