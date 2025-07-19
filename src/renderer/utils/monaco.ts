import * as monaco from 'monaco-editor';

/**
 * Get Monaco language identifier from file extension
 * 
 * Monaco needs to know what language a file is written in to provide
 * proper syntax highlighting and IntelliSense.
 */
export const getLanguageFromFile = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'sql':
      return 'sql';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
};

/**
 * Configure Monaco editor for test files with Jest globals
 * 
 * This adds TypeScript definitions for Jest functions like describe, it, expect, etc.
 * so that Monaco can provide proper IntelliSense in test files.
 */
export const configureMonacoForTestFiles = () => {
  // Add Jest globals to TypeScript
  monaco.languages.typescript.typescriptDefaults.addExtraLib(`
    declare global {
      function describe(name: string, fn: () => void): void;
      function it(name: string, fn: () => void): void;
      function test(name: string, fn: () => void): void;
      function expect(value: any): any;
      function beforeEach(fn: () => void): void;
      function afterEach(fn: () => void): void;
      function beforeAll(fn: () => void): void;
      function afterAll(fn: () => void): void;
    }
  `, 'jest-globals.d.ts');

  // Configure TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    allowJs: true,
    skipLibCheck: true,
    esModuleInterop: true,
    noImplicitAny: false,
    sourceMap: true,
    resolveJsonModule: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    types: ['jest', 'node']
  });
}; 