import { LitElement, html } from 'lit';
import * as monaco from 'monaco-editor';
import type { BlockModel } from '@blocksuite/store';

// 1. Define the schema for our custom block
export const MonacoBlockSchema = {
  name: 'filestack:code',
  props: {
    code: 'text' as const,
    language: 'string' as const,
  },
};

// This creates a specific type for our block's model
export type MonacoBlockModel = BlockModel<typeof MonacoBlockSchema>;

// 2. Define the custom element (the view) for the block
export class MonacoBlockView extends LitElement {
  static properties = {
    model: { attribute: false }
  };

  model!: MonacoBlockModel;
  private _editor: monaco.editor.IStandaloneCodeEditor | null = null;

  constructor() {
    super();
    this.model = null as any; // Will be set by parent
  }

  override render() {
    return html`<div style="height: 400px; border: 1px solid #eee;"></div>`;
  }

  override firstUpdated() {
    const container = this.renderRoot.querySelector('div');
    if (container) {
      this._editor = monaco.editor.create(container, {
        value: '// Code will be loaded here',
        language: 'typescript',
      });

      this._editor.onDidChangeModelContent(() => {
        if (this._editor) {
          const value = this._editor.getValue();
          console.log('Code changed:', value);
          // TODO: Update the model when we figure out the correct API
        }
      });
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._editor?.dispose();
  }
}

// Register the custom element
customElements.define('monaco-block-view', MonacoBlockView); 