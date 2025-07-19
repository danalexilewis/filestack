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
    // Check if Electron API is available
    if (!window.electron) {
      console.error('Electron API not available');
      return;
    }
    
    window.electron.onConfigLoaded((loadedViews: any[]) => {
      setViews(loadedViews);
      
      // Set the first view as active if no view is currently active
      if (loadedViews.length > 0 && !activeView) {
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



  const handleSave = () => {
    if (!window.electron) {
      console.error('Electron API not available for save');
      return;
    }
    
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
          onClick={() => {
            if (window.electron) {
              window.electron.openWorkspace();
            } else {
              console.error('Electron API not available');
            }
          }}
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
                {dirtyFiles.includes(view.path) && (
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