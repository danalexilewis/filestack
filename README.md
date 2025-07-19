# Filestack - Monaco Editor Integration

Filestack is a simple idea, its a view system that allows you to create documents with code blocks that are editable instances of files in the codebase. This is useful when say you want to look at a front end component, your query code in your data access layer, maybe the api contract or domain model and then the backend corresponding request. Filestack allows these different files to be recombined as a virtual functional layer. It also solves the problem of where to put domain documentation, just put it next to the code.

This project was almost entirely inspired by Org Mode in emacs!

Note from Dan:

Filestack was an expirement in UX and also an experiment in how far and quickly I could direct cursor to build out a functioning Proof of Concept. 
To get to the point I open sourced this repo it took about 10 hours all together. From ideation to coding and manual bebugging.

This was partly also done so I could convince a friend Sonny to play with the idea as well 😈

## 🚀 Features

- **Monaco Editor Integration**: Full-featured code editing with syntax highlighting and IntelliSense
- **TipTap Rich Text Editor**: Modern, extensible rich text editing
- **Explicit Save System**: Unsaved changes tracking with visual indicators
- **Slash Commands**: Quick insertion of content blocks with `/` commands
- **Multi-file Support**: Edit multiple files within a single document
- **TypeScript Support**: Full TypeScript support with proper type definitions

## 📁 Project Structure

```
filestack/
├── src/
│   ├── components/           # Shared UI components
│   │   ├── SlashCommand.tsx  # Slash command menu component
│   │   └── ui/              # Reusable UI components
│   ├── renderer/            # Main editor functionality
│   │   ├── components/      # Editor-specific components
│   │   │   ├── EditorHeader/     # Header with title and save button
│   │   │   ├── EditorContent/    # Main editor content wrapper
│   │   │   ├── EditorPlaceholder/# Placeholder when no view selected
│   │   │   └── MonacoBlock/      # Monaco editor block component
│   │   ├── extensions/      # TipTap extensions
│   │   │   ├── MonacoBlock.ts    # Monaco block node extension
│   │   │   └── SlashCommands.tsx # Slash command functionality
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useTipTapEditor.ts# TipTap editor configuration
│   │   ├── utils/           # Utility functions
│   │   │   ├── monaco.ts         # Monaco editor utilities
│   │   │   └── contentBuilder.ts # Content building utilities
│   │   ├── store.ts         # Global state management
│   │   ├── Editor.tsx       # Main editor component
│   │   └── README.md        # Detailed renderer documentation
│   ├── shared/              # Shared types and utilities
│   │   └── types.ts         # TypeScript type definitions
│   └── main.ts              # Electron main process
├── examples/                # Example configurations
└── README.md               # This file
```

## 🧩 Key Components

### MonacoBlock Component
The heart of the application - integrates Monaco editor within TipTap blocks:
- **File Editing**: Full Monaco editor functionality for code files
- **Unsaved Changes**: Tracks changes with visual indicators (orange dot = unsaved, green = saved)
- **Save System**: Explicit save buttons per block and "Save All" functionality
- **Focus Management**: Seamless integration between TipTap and Monaco selection

### TipTap Extensions
- **MonacoBlock**: Custom node for Monaco editor blocks
- **SlashCommands**: Slash command system for quick content insertion

### State Management
- **Zustand Store**: Global state for views, file contents, and unsaved changes
- **Explicit Saving**: Changes are tracked separately until explicitly saved

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run start
```

### Building
```bash
npm run build
```

## 🎯 Key Concepts

### Monaco Editor Integration
- **Models**: File content representation, shared between editors
- **Lifecycle**: Creation, focus, content changes, disposal
- **Selection Sync**: Keeps TipTap and Monaco selection synchronized

### TipTap Integration
- **NodeViewProps**: Props provided to custom node components
- **Extensions**: Custom functionality added to TipTap
- **Commands**: Actions performed on the editor

### State Management
- **Unsaved Changes**: Stored separately from saved content
- **Explicit Saving**: User must click save to persist changes
- **Bulk Operations**: Save all files at once

## 🔧 Development

### Adding New File Types
1. Update `getLanguageFromFile()` in `src/renderer/utils/monaco.ts`
2. Test with a file of that type

### Adding New Slash Commands
1. Update the commands array in `src/renderer/extensions/SlashCommands.tsx`
2. Test the command functionality

### Modifying Monaco Block Behavior
1. Update `src/renderer/components/MonacoBlock/MonacoBlock.tsx`
2. Update `src/renderer/extensions/MonacoBlock.ts` if needed
3. Test focus, selection, and save functionality

### Adding New Content Types
1. Update `src/renderer/utils/contentBuilder.ts` to handle the new type
2. Update the View type in `src/shared/types.ts` if needed
3. Test content building and rendering

## 📝 Code Quality

### Modular Architecture
- **Single Responsibility**: Each component/function has one clear purpose
- **Clear Separation**: Components, extensions, utilities, and hooks are well-separated
- **Easy Navigation**: Logical folder structure makes code easy to find

### Documentation
- **JSDoc Comments**: Complex concepts are explained in detail
- **README Files**: Comprehensive documentation for each module
- **Type Safety**: Full TypeScript support throughout

### Best Practices
- **Clean Imports**: Index files provide clean import paths
- **Consistent Naming**: Descriptive names that explain functionality
- **Error Handling**: Proper error handling and user feedback

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the modular structure and documentation
4. **Test thoroughly**: Ensure all functionality works as expected
5. **Submit a pull request**: Include clear description of changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Monaco Editor**: Microsoft's powerful code editor
- **TipTap**: Modern rich text editor framework
- **Electron**: Cross-platform desktop app framework
- **Zustand**: Lightweight state management 
