import '@testing-library/jest-dom';

// Mock Monaco editor globally
(global as any).monaco = {
  editor: {
    create: jest.fn(() => ({
      onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
      onDidFocusEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
      onDidBlurEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      updateOptions: jest.fn(),
      focus: jest.fn(),
      dispose: jest.fn(),
    })),
    createModel: jest.fn(() => ({
      dispose: jest.fn(),
    })),
    Uri: {
      parse: jest.fn(() => 'inmemory://test.ts'),
    },
  },
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})); 