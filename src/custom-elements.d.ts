import type { PageEditor } from '@blocksuite/presets';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'page-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<PageEditor>,
        PageEditor
      >;
    }
  }
} 