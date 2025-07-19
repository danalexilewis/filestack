import React, { useEffect } from 'react';
import Editor from './Editor';
import { useStore } from './store';

const App: React.FC = () => {
  const {
    views,
    setActiveView,
    setViews,
    dirtyFiles,
    activeView,
    fileContents,
    setFileContents,
    unmarkFileAsDirty,
    workspacePath,
    setWorkspacePath,
  } = useStore();

  useEffect(() => {
    window.electron.onConfigLoaded((loadedViews: any[]) => {
      console.log('Config loaded:', loadedViews);
      console.log('First view content:', loadedViews[0]?.content);
      console.log('First view files:', loadedViews[0]?.files);
      console.log('All views:', JSON.stringify(loadedViews, null, 2));
      setViews(loadedViews);
      
      // Set the first view as active if no view is currently active
      if (loadedViews.length > 0 && !activeView) {
        console.log('Setting first view as active:', loadedViews[0].title);
        setActiveView(loadedViews[0].title);
      }
    });
    // This is a new event that I will add to the preload script
    window.electron.onWorkspaceOpened((path: string) => {
      setWorkspacePath(path);
    });
    
    window.electron.onConfigError((errorMessage: string) => {
      console.error('Config error:', errorMessage);
    });
  }, [setViews, setWorkspacePath, setActiveView, activeView]);

  // Load file contents when active view changes
  useEffect(() => {
    if (activeView && workspacePath) {
      const currentView = views.find(view => view.title === activeView);
      if (currentView) {
        console.log(`Loading file contents for view: ${activeView}`, currentView.files);
        window.electron.getWorkspaceFileContents(currentView.files).then((contents) => {
          console.log('File contents loaded:', Object.keys(contents));
          Object.entries(contents).forEach(([file, content]) => {
            console.log(`Setting content for ${file}, length: ${content.length}`);
            setFileContents(file, content);
          });
        }).catch((error) => {
          console.error('Error loading file contents:', error);
        });
      }
    }
  }, [activeView, workspacePath, views, setFileContents]);

  const handleSave = () => {
    const filesToSave: Record<string, string> = {};
    dirtyFiles.forEach((file) => {
      filesToSave[file] = fileContents[file];
    });
    window.electron.saveFiles(filesToSave).then(() => {
      dirtyFiles.forEach((file) => unmarkFileAsDirty(file));
    });
  };

  if (!workspacePath) {
    return (
      <div>
        <h1>Welcome to FileStack</h1>
        <button onClick={() => window.electron.openWorkspace()}>Open Workspace</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100vw' }}>
      <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
        <h2>Views</h2>
        <button onClick={handleSave} disabled={dirtyFiles.length === 0}>
          Save
        </button>
        <ul>
          {views.map((view) => (
            <li key={view.title}>
              <button
                onClick={() => setActiveView(view.title)}
                style={{
                  fontWeight: activeView === view.title ? 'bold' : 'normal',
                  all: 'unset',
                  cursor: 'pointer',
                }}
              >
                {view.title}
                {view.files.some((file) => dirtyFiles.includes(file)) && ' *'}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, width: 'calc(100vw - 200px)' }}>
        <Editor />
      </div>
    </div>
  );
};

export default App; 