# Renderer Module Structure

This directory contains the main editor functionality, broken down into modular, maintainable components.

## 📁 Directory Structure

```
src/renderer/
├── components/           # React components
│   ├── EditorHeader/     # Header with title and save button
│   ├── EditorContent/    # Main editor content wrapper
│   ├── EditorPlaceholder/# Placeholder when no view selected
│   └── MonacoBlock/      # Monaco editor block component
├── extensions/           # TipTap extensions
│   ├── MonacoBlock.ts    # Monaco block node extension
│   └── SlashCommands.tsx # Slash command functionality
├── hooks/                # Custom React hooks
│   └── useTipTapEditor.ts# TipTap editor configuration
├── utils/                # Utility functions
│   ├── monaco.ts         # Monaco editor utilities
│   └── contentBuilder.ts # Content building utilities
├── store.ts              # Global state management
├── Editor.tsx            # Main editor component
└── README.md             # This file
```

## 🧩 Components

### EditorHeader
- Displays the current view title
- Shows "Save All" button when there are unsaved changes
- Clean, focused component with minimal logic

### EditorContent
- Wraps the TipTap editor with proper styling
- Handles editor initialization state
- Provides consistent layout and styling

### EditorPlaceholder
- Shows when no view is selected
- Simple, focused component for user guidance

### MonacoBlock
- Complex component that integrates Monaco editor with TipTap
- Handles file editing, unsaved changes tracking, and save functionality
- Manages focus and selection synchronization
- **Key concepts**: NodeViewProps, Monaco lifecycle, state management, selection sync

## 🔌 Extensions

### MonacoBlock Extension
- Defines a custom TipTap node for Monaco editors
- Handles HTML parsing and rendering
- Connects to the MonacoBlock component

### SlashCommands Extension
- Provides slash command functionality (`/` menu)
- Uses TipTap's suggestion system
- Handles keyboard navigation and command execution

## 🪝 Hooks

### useTipTapEditor
- Custom hook for TipTap editor configuration
- Centralizes all editor setup logic
- Makes the main Editor component cleaner

## 🛠️ Utilities

### Monaco Utilities (`monaco.ts`)
- `getLanguageFromFile()` - Maps file extensions to Monaco language IDs
- `configureMonacoForTestFiles()` - Sets up Jest globals for test files

### Content Builder (`contentBuilder.ts`)
- `buildContentFromView()` - Converts view definitions to TipTap content
- `buildFallbackContent()` - Creates basic content when no definition exists

## 🔄 State Management

### Store (`store.ts`)
- Global state using Zustand
- Manages views, file contents, and unsaved changes
- Provides save functionality

## 🎯 Key Concepts

### TipTap Integration
- **NodeViewProps**: Props provided by TipTap to custom node components
- **Extensions**: Custom functionality added to TipTap
- **Commands**: Actions that can be performed on the editor

### Monaco Editor
- **Models**: Represent file content, can be shared between editors
- **Lifecycle**: Creation, focus, content changes, disposal
- **Selection Sync**: Keeping TipTap and Monaco selection in sync

### State Management
- **Unsaved Changes**: Stored separately from saved content
- **Explicit Saving**: User must click save to persist changes
- **Bulk Operations**: Save all files at once

## 🚀 Development Workflow

1. **Adding new components**: Create in `components/` with clear separation of concerns
2. **Adding new extensions**: Create in `extensions/` and export from index
3. **Adding utilities**: Create in `utils/` and export from index
4. **State changes**: Modify `store.ts` and update components as needed

## 📝 Best Practices

- **Single Responsibility**: Each component/function has one clear purpose
- **Clear Naming**: Use descriptive names that explain what things do
- **Documentation**: JSDoc comments explain complex concepts
- **Modularity**: Easy to find, understand, and modify individual pieces
- **Type Safety**: Full TypeScript support throughout

## 🔧 Common Tasks

### Adding a new file type
1. Update `getLanguageFromFile()` in `utils/monaco.ts`
2. Test with a file of that type

### Adding a new slash command
1. Update the commands array in `extensions/SlashCommands.tsx`
2. Test the command functionality

### Modifying Monaco block behavior
1. Update `components/MonacoBlock/MonacoBlock.tsx`
2. Update `extensions/MonacoBlock.ts` if needed
3. Test focus, selection, and save functionality

### Adding new content types
1. Update `utils/contentBuilder.ts` to handle the new type
2. Update the View type in `shared/types.ts` if needed
3. Test content building and rendering 