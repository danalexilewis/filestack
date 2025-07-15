# FileStack

A custom VS Code fork that introduces a new editor mode designed for domain-driven workflows.

## Overview

FileStack enables a single scrollable view where multiple related source files (e.g. queries, mutations, API, contracts) are stacked vertically, each with full editing capabilities and all native VS Code features intact (IntelliSense, Git, extensions, etc.).

## Features

- **Stacked File View**: Multiple files rendered in a single vertical scrollable layout
- **Full VS Code Integration**: Preserves all native features (IntelliSense, Git, extensions, LSP, etc.)
- **Domain-Driven Workflows**: Organize related files by domain using `.filestack.json` configuration
- **Single Cursor Navigation**: Unified cursor experience across all stacked files
- **Keyboard Navigation**: Page Up/Down and Cmd+Up/Down to jump between files
- **Save All**: Single command to save all files in the stack

## Configuration Format

Create a `.filestack.json` file to define which files to stack:

```json
{
  "title": "User Domain Stack",
  "files": [
    "dal/user/queries.ts",
    "dal/user/mutations.ts", 
    "dal/user/api.ts",
    "dal/user/contract.ts"
  ]
}
```

### File Path Resolution

File paths in `.filestack.json` support both:
- **Relative to workspace root**: `"dal/user/queries.ts"`
- **Relative to .filestack.json location**: `"./queries.ts"`
- **Absolute paths**: `"/absolute/path/file.ts"`

## Development Setup

### Prerequisites

- Node.js 18+ 
- Git
- Python 3.8+ (for VS Code build tools)
- C++ build tools (for native dependencies)

### Getting Started

1. **Clone VS Code** (if not already done):
   ```bash
   git clone https://github.com/microsoft/vscode.git
   cd vscode
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build VS Code**:
   ```bash
   npm run build
   ```

4. **Run in development mode**:
   ```bash
   npm run watch
   ```

### FileStack Implementation

The FileStack feature is implemented in:
```
src/vs/workbench/contrib/filestack/
```

Key components:
- `filestackEditor.ts` - Main editor implementation
- `filestackEditorInput.ts` - Editor input handling
- `filestackConfiguration.ts` - JSON configuration parsing
- `filestackEditorModel.ts` - Editor model and state management

## Architecture

### Core Principles

1. **Minimal Changes**: All FileStack code is isolated in `src/vs/workbench/contrib/filestack/`
2. **VS Code Compatibility**: Preserves all existing VS Code features and extension APIs
3. **Single Cursor**: One unified cursor across all stacked files
4. **Explicit Save**: Changes require explicit saving with visual indicators

### Technical Constraints

- Do not modify core editor layout
- Do not modify extension APIs  
- Do not modify document model
- Preserve compatibility with extensions, Git, LSP, and AI features

## Testing

### Unit Tests
- JSON configuration parser
- File loading and validation
- Editor state management

### Integration Tests
- Sample `.filestack.json` files
- End-to-end editor functionality
- Keyboard navigation

## Future Enhancements

- Sidebar navigation between sections
- Collapsible file blocks
- `.filestack.md` for annotations
- `.filestack.js` for dynamic views
- Cross-file search functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make minimal changes in the `filestack` directory
4. Add tests for new functionality
5. Submit a pull request

## License

This project is based on VS Code and follows the same licensing terms. 