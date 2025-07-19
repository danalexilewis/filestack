import React from 'react';

/**
 * Editor Placeholder Component
 * 
 * Shows when no view is selected, prompting the user to select a view from the sidebar.
 */
const EditorPlaceholder: React.FC = () => {
  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold text-gray-800">
        Select a view from the sidebar to start editing
      </h2>
    </div>
  );
};

export default EditorPlaceholder; 