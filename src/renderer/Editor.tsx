import React, { useEffect } from 'react';
import { useStore } from './store';
import FileEditor from './FileEditor';

const Editor: React.FC = () => {
  const { activeView, views, setFileContents } = useStore();

  useEffect(() => {
    if (activeView) {
      const view = views.find((v) => v.title === activeView);
      if (view) {
        window.electron.getWorkspaceFileContents(view.files).then((contents) => {
          Object.entries(contents).forEach(([file, content]) => {
            setFileContents(file, content);
          });
        });
      }
    }
  }, [activeView, views, setFileContents]);

  const activeViewData = views.find((v) => v.title === activeView);

  return (
    <div style={{ overflowY: 'auto', width: '100%' }}>
      {activeViewData ? (
        activeViewData.files.map((filePath) => (
          <FileEditor key={filePath} filePath={filePath} />
        ))
      ) : (
        <div>Select a view to see the files</div>
      )}
    </div>
  );
};

export default Editor; 