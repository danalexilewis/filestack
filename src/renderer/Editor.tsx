import React, { useEffect, useRef } from 'react';
import { useStore } from './store';
import * as monaco from 'monaco-editor';

const Editor = () => {
  const { activeView, views, fileContents, setFileContents, markFileAsDirty } = useStore();
  const editorRefs = useRef<Record<string, monaco.editor.IStandaloneCodeEditor>>({});
  const currentViewRef = useRef<string | null>(null);

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
    // Add Jest globals to Monaco's TypeScript language service
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

    // Configure TypeScript compiler options for test files
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      noImplicitAny: false, // Relax this for test files
      sourceMap: true,
      resolveJsonModule: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      types: ['jest', 'node']
    });
  };

  useEffect(() => {
    // Configure Monaco once on mount
    configureMonacoForTestFiles();
  }, []);

  // Create editors when view changes
  useEffect(() => {
    if (currentView && currentView.title !== currentViewRef.current) {
      currentViewRef.current = currentView.title;
      
      // Clean up existing editors
      Object.values(editorRefs.current).forEach(editor => {
        editor.dispose();
      });
      editorRefs.current = {};

      // Create new editors for each file
      currentView.files.forEach((file) => {
        const containerId = `editor-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const container = document.getElementById(containerId);
        
        if (container) {
          const language = getLanguageFromFile(file);
          
          const editor = monaco.editor.create(container, {
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

          // Set initial height
          updateEditorHeight(editor, container);

          // Update height when content changes
          const disposable = editor.onDidContentSizeChange(() => {
            updateEditorHeight(editor, container);
          });

          // Track changes and update store
          const changeDisposable = editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            if (newValue !== fileContents[file]) {
              setFileContents(file, newValue);
              markFileAsDirty(file);
            }
          });

          editorRefs.current[file] = editor;
        }
      });
    }

    return () => {
      if (!currentView) {
        Object.values(editorRefs.current).forEach(editor => {
          editor.dispose();
        });
        editorRefs.current = {};
        currentViewRef.current = null;
      }
    };
  }, [currentView, setFileContents, markFileAsDirty]);

  // Update editor content when fileContents changes (without recreating editors)
  useEffect(() => {
    Object.entries(editorRefs.current).forEach(([file, editor]) => {
      const currentValue = editor.getValue();
      const newValue = fileContents[file] || '';
      
      // Only update if the content actually changed and it's not from user input
      if (currentValue !== newValue) {
        // Temporarily disable the change listener to avoid loops
        const model = editor.getModel();
        if (model) {
          model.setValue(newValue);
        }
      }
    });
  }, [fileContents]);

  if (!activeView || !currentView) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Select a view from the sidebar to start editing</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>{currentView.title}</h2>
      {currentView.files.map((file) => {
        const containerId = `editor-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const language = getLanguageFromFile(file);
        
        return (
          <div key={file} style={{ marginBottom: '20px', border: '1px solid #ccc', height: 'auto' }}>
            <div style={{ 
              padding: '8px 12px', 
              background: '#f5f5f5', 
              borderBottom: '1px solid #ccc',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {file} ({language})
            </div>
            <div 
              id={containerId}
              style={{ 
                minHeight: '200px',
                width: '100%'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Editor; 