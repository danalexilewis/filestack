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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to FileStack</h1>
        <button 
          onClick={() => window.electron.openWorkspace()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
        >
          Open Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen">
      <div className="w-52 border-r border-gray-300 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Views</h2>
          <button 
            onClick={handleSave} 
            disabled={dirtyFiles.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 text-sm"
          >
            Save {dirtyFiles.length > 0 && `(${dirtyFiles.length})`}
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {views.map((view) => (
            <li key={view.title} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => setActiveView(view.title)}
                className={`
                  w-full text-left px-4 py-3 transition-colors duration-150
                  ${activeView === view.title 
                    ? 'bg-blue-100 text-blue-900 font-semibold border-r-2 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="block truncate">{view.title}</span>
                {view.files.some((file) => dirtyFiles.includes(file)) && (
                  <span className="text-orange-500 text-xs">• Modified</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor />
      </div>
    </div>
  );
};

export default App; 