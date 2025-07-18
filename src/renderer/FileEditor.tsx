import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { useStore } from './store';

interface FileEditorProps {
  filePath: string;
}

const FileEditor: React.FC<FileEditorProps> = ({ filePath }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const { fileContents, setFileContents, markFileAsDirty } = useStore();
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const fileContent = fileContents[filePath] || '';

  useEffect(() => {
    if (editorRef.current) {
      const editorInstance = monaco.editor.create(editorRef.current, {
        value: fileContent,
        language: 'typescript',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        scrollbar: {
          vertical: 'hidden',
        },
        overviewRulerLanes: 0,
      });

      initVimMode(editorInstance, statusBarRef.current);
      setEditor(editorInstance);

      const updateHeight = () => {
        const contentHeight = editorInstance.getContentHeight();
        if (editorRef.current) {
          editorRef.current.style.height = `${contentHeight}px`;
        }
      };

      updateHeight();
      const disposable = editorInstance.onDidContentSizeChange(updateHeight);

      editorInstance.onDidChangeModelContent(() => {
        const currentContent = editorInstance.getValue();
        if (currentContent !== fileContent) {
          setFileContents(filePath, currentContent);
          markFileAsDirty(filePath);
        }
      });

      return () => {
        disposable.dispose();
        editorInstance.dispose();
      };
    }
  }, [filePath]);

  useEffect(() => {
    if (editor && editor.getValue() !== fileContent) {
      editor.setValue(fileContent);
    }
  }, [editor, fileContent]);

  return (
    <div style={{ border: '1px solid #ccc', marginBottom: '1rem' }}>
      <h3>{filePath}</h3>
      <div ref={editorRef} />
      <div ref={statusBarRef} style={{ flexShrink: 0, height: '20px', background: '#eee' }} />
    </div>
  );
};

export default FileEditor; 