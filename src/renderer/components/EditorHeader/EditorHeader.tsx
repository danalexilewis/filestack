import React from 'react';

interface EditorHeaderProps {
  title: string;
  unsavedChangesCount: number;
  onSaveAll: () => void;
}

/**
 * Editor Header Component
 * 
 * Displays the current view title and a "Save All" button when there are unsaved changes.
 */
const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  title, 
  unsavedChangesCount, 
  onSaveAll 
}) => {
  return (
    <div className="p-5 border-b border-gray-200 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {unsavedChangesCount > 0 && (
          <button
            onClick={onSaveAll}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Save All ({unsavedChangesCount} files)
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorHeader; 