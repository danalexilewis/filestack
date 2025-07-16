# FileStack - An `org-mode` Inspired Prototype

FileStack is a standalone desktop application built with Electron to prototype a novel, domain-driven workflow inspired by Emacs' `org-mode`. The goal is to create a functional proof-of-concept demonstrating a "stacked" file view, where multiple files can be managed as a single, cohesive unit.

This project serves as a living specification for a potential future VS Code extension.

---

## Key Features

- **Stacked File Views**: Define sets of related files in a `filestack.json` configuration. Each set, or "view," is rendered as a single, scrollable document in the editor.
- **Vim Keybindings**: The editor provides Vim keybindings for efficient, keyboard-driven navigation and editing.
- **Workspace-Aware**: Open any directory as a workspace, and FileStack will automatically detect and load its configuration.
- **Content Folding**: Collapse and expand individual file sections within a view to focus on the task at hand.
- **Modern Tooling**: Built with TypeScript, Vite for hot-reloading, and Zod for robust configuration validation.

---

## Architecture

- **Electron**: Provides the cross-platform application shell.
- **TypeScript**: Ensures the entire codebase is type-safe and maintainable.
- **Vite**: Powers the development environment with a fast build process and hot module replacement (HMR).
- **Zod**: Used in the main process to parse and validate the `filestack.json` configuration, ensuring data integrity and providing clear error messages.
- **Zustand**: A minimal, fast state management library used in the renderer process to manage UI state, such as the active workspace, the list of views, and the content of the editor.

---

## Getting Started (Development)

To get the application running locally:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd filestack
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm start
    ```

This will launch the application in development mode with hot reloading enabled. Any changes made to the source code will be reflected instantly. 