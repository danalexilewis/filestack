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
      
      // Load all files from all views at once
      const allFiles = loadedViews.flatMap(view => view.files);
      const uniqueFiles = [...new Set(allFiles)];
      console.log('Loading all files from all views:', uniqueFiles);
      
      window.electron.getWorkspaceFileContents(uniqueFiles).then((contents) => {
        console.log('All file contents loaded:', Object.keys(contents));
        Object.entries(contents).forEach(([file, content]) => {
          console.log(`Setting content for ${file}, length: ${content.length}`);
          setFileContents(file, content);
        });
      }).catch((error) => {
        console.error('Error loading all file contents:', error);
      });
      
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
  }, [setViews, setWorkspacePath, setActiveView, activeView, setFileContents]);

  // Log when active view changes (files should already be loaded)
  useEffect(() => {
    if (activeView) {
      const currentView = views.find(view => view.title === activeView);
      if (currentView) {
        console.log(`Switched to view: ${activeView}`);
        console.log(`Files in this view:`, currentView.files);
        console.log(`Files loaded in store:`, Object.keys(fileContents));
        
        // Check if all files for this view are loaded
        const missingFiles = currentView.files.filter(file => fileContents[file] === undefined);
        if (missingFiles.length > 0) {
          console.warn(`Missing files for view ${activeView}:`, missingFiles);
        } else {
          console.log(`All files for view ${activeView} are loaded`);
        }
      }
    }
  }, [activeView, views, fileContents]);

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