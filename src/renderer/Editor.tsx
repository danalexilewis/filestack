import React, { useEffect, useRef } from 'react';
import { useStore } from './store';
import { configureMonacoForTestFiles } from './utils/monaco';
import { buildContentFromView, buildFallbackContent } from './utils/contentBuilder';
import { useTipTapEditor } from './hooks/useTipTapEditor';
import EditorHeader from './components/EditorHeader/EditorHeader';
import EditorContent from './components/EditorContent/EditorContent';
import EditorPlaceholder from './components/EditorPlaceholder/EditorPlaceholder';

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
  // TIPTAP EDITOR
  // ============================================================================
  
  // Create and configure the TipTap editor using our custom hook
  const editor = useTipTapEditor();
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Initialize content when view changes or file contents update
  useEffect(() => {
    if (currentView && currentView.title !== currentViewRef.current) {
      currentViewRef.current = currentView.title;
      
      if (editor) {
        if (currentView.content) {
          // Build content from the view's content definition
          const contentArray = buildContentFromView(currentView);
          editor.commands.setContent(contentArray);
        } else {
          // Fallback: create content from file list
          const contentArray = buildFallbackContent(currentView);
          editor.commands.setContent(contentArray);
        }
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
    return <EditorPlaceholder />;
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with view title and save all button */}
      <EditorHeader 
        title={currentView.title}
        unsavedChangesCount={Object.keys(unsavedChanges).length}
        onSaveAll={saveAllFiles}
      />
      
      {/* Main editor area */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor; 