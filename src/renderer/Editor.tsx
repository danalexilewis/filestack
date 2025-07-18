import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { useStore } from './store';

const Editor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const { activeView, views, fileContents, setFileContents, markFileAsDirty } = useStore();
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      const editorInstance = monaco.editor.create(editorRef.current, {
        value: '',
        language: 'javascript',
      });

      initVimMode(editorInstance, statusBarRef.current);
      setEditor(editorInstance);

      editorInstance.onDidChangeModelContent(() => {
        if (editorInstance && activeView) {
          const view = views.find((v) => v.title === activeView);
          if (view) {
            const content = editorInstance.getValue();
            // This is a simplistic way to handle this. A more robust solution
            // would involve a more sophisticated parsing mechanism.
            for (const file of view.files) {
              const startMarker = `// START: ${file}`;
              const endMarker = `// END: ${file}`;
              const startIndex = content.indexOf(startMarker);
              const endIndex = content.indexOf(endMarker);

              if (startIndex !== -1 && endIndex !== -1) {
                const fileContent = content.substring(startIndex + startMarker.length, endIndex).trim();
                const currentContent = (fileContents[file] || '').trim();
                if (fileContent !== currentContent) {
                  setFileContents(file, fileContent);
                  markFileAsDirty(file);
                }
              }
            }
          }
        }
      });

      return () => {
        editorInstance.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (activeView && views.length > 0) {
      const view = views.find((v) => v.title === activeView);
      if (view) {
        window.electron.getWorkspaceFileContents(view.files).then((contents: Record<string, string>) => {
          Object.entries(contents).forEach(([file, content]: [string, string]) => {
            setFileContents(file, content);
          });
        });
      }
    }
  }, [activeView, views, setFileContents]);

  useEffect(() => {
    if (editor && activeView) {
      const view = views.find((v) => v.title === activeView);
      if (view) {
        const allContent = view.files
          .map((file) => `// START: ${file}\n${fileContents[file] || ''}\n// END: ${file}`)
          .join('\n\n');
        editor.setValue(allContent);
      }
    }
  }, [editor, activeView, views, fileContents]);

  useEffect(() => {
    if (editor) {
      const foldingProvider = monaco.languages.registerFoldingRangeProvider(
        'javascript',
        {
          provideFoldingRanges: (
            model: monaco.editor.ITextModel,
            context: monaco.languages.FoldingContext,
            token: monaco.CancellationToken
          ) => {
            const ranges: monaco.languages.FoldingRange[] = [];
            const lines = model.getLinesContent();
            let start = -1;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('// START:')) {
                start = i;
              } else if (lines[i].startsWith('// END:')) {
                if (start !== -1) {
                  ranges.push({
                    start: start + 1,
                    end: i,
                    kind: monaco.languages.FoldingRangeKind.Region,
                  });
                  start = -1;
                }
              }
            }
            return ranges;
          },
        }
      );
      return () => {
        foldingProvider.dispose();
      };
    }
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, () => {
        const model = editor.getModel();
        const currentPosition = editor.getPosition();
        if (model && currentPosition) {
          const lines = model.getLinesContent();
          for (let i = currentPosition.lineNumber; i < lines.length; i++) {
            if (lines[i].startsWith('// START:')) {
              editor.setPosition({ lineNumber: i + 1, column: 1 });
              editor.revealLine(i + 1);
              return;
            }
          }
        }
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, () => {
        const model = editor.getModel();
        const currentPosition = editor.getPosition();
        if (model && currentPosition) {
          const lines = model.getLinesContent();
          for (let i = currentPosition.lineNumber - 2; i >= 0; i--) {
            if (lines[i].startsWith('// START:')) {
              editor.setPosition({ lineNumber: i + 1, column: 1 });
              editor.revealLine(i + 1);
              return;
            }
          }
        }
      });
    }
  }, [editor, activeView, views]);

  useEffect(() => {
    if (editor) {
      const model = editor.getModel();
      if (model) {
        const decorations = model.getAllDecorations();
        const newDecorations = [];
        const lines = model.getLinesContent();
        for (let i = 0; i < lines.length; i++) {
          const todoIndex = lines[i].indexOf('TODO');
          if (todoIndex !== -1) {
            newDecorations.push({
              range: new monaco.Range(i + 1, todoIndex + 1, i + 1, todoIndex + 5),
              options: { inlineClassName: 'todo-highlight' },
            });
          }
          const doneIndex = lines[i].indexOf('DONE');
          if (doneIndex !== -1) {
            newDecorations.push({
              range: new monaco.Range(i + 1, doneIndex + 1, i + 1, doneIndex + 5),
              options: { inlineClassName: 'done-highlight' },
            });
          }
        }
        model.deltaDecorations(decorations.map(d => d.id), newDecorations);
      }
    }
  }, [editor, fileContents]);


  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={editorRef} style={{ height: '100%', width: '100%' }} />
      <div ref={statusBarRef} style={{ flexShrink: 0, height: '20px', background: '#eee' }} />
    </div>
  );
};

export default Editor; 