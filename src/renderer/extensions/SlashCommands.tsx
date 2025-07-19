import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import { createRoot } from 'react-dom/client';
import { SlashCommand } from '../../components/SlashCommand';

/**
 * Slash Commands Extension - Provides slash command functionality
 * 
 * This extension shows a command menu when the user types '/' at the beginning of a line.
 * It uses TipTap's suggestion system to handle the UI and interactions.
 */
const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        
        // What to do when a command is selected
        command: ({ editor, range, props }) => {
          // Delete the trigger character and replace with the selected command
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(props.command)
            .run()
        },
        
        // Available commands
        items: ({ query }) => {
          const commands = [
            { title: 'Heading', command: '<h1>Heading</h1>' },
            { title: 'Subheading', command: '<h2>Subheading</h2>' },
            { title: 'Bullet List', command: '<ul><li>List item</li></ul>' },
            { title: 'Code Block', command: '<pre><code>Code block</code></pre>' },
            { title: 'Monaco Editor', command: 'monaco' },
          ]
          
          // Filter commands based on user input
          if (query) {
            return commands.filter(item => 
              item.title.toLowerCase().includes(query.toLowerCase())
            )
          }
          
          return commands
        },
        
        // How to render the command menu
        render: () => {
          let popup: any
          let selectedIndex = 0
          let root: any

          return {
            // When slash command starts
            onStart: (props) => {
              // Create popup element
              popup = document.createElement('div')
              popup.className = 'slash-command-popup'
              
              // Calculate position based on cursor
              const { range } = props
              const coords = props.editor.view.coordsAtPos(range.from)
              
              popup.style.cssText = `
                position: fixed;
                z-index: 9999;
                left: ${coords.left}px;
                top: ${coords.bottom + 10}px;
              `
              document.body.appendChild(popup)
              
              // Create React root and render component
              root = createRoot(popup)
              root.render(
                <SlashCommand
                  items={props.items}
                  selectedIndex={selectedIndex}
                  onSelect={(command) => {
                    props.command({ editor: props.editor, range: props.range, props: { command } })
                  }}
                  query={props.query}
                />
              )
            },
            
            // When slash command updates (user types more)
            onUpdate: (props) => {
              if (root) {
                root.render(
                  <SlashCommand
                    items={props.items}
                    selectedIndex={selectedIndex}
                    onSelect={(command) => {
                      props.command({ editor: props.editor, range: props.range, props: { command } })
                    }}
                    query={props.query}
                  />
                )
              }
            },
            
            // Handle keyboard navigation
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                props.event.preventDefault()
                return true
              }
              if (props.event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % (props as any).items.length
                if (root) {
                  root.render(
                    <SlashCommand
                      items={(props as any).items}
                      selectedIndex={selectedIndex}
                      onSelect={(command) => {
                        (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command } })
                      }}
                      query={(props as any).query}
                    />
                  )
                }
                return true
              }
              if (props.event.key === 'ArrowUp') {
                selectedIndex = selectedIndex === 0 
                  ? (props as any).items.length - 1 
                  : selectedIndex - 1
                if (root) {
                  root.render(
                    <SlashCommand
                      items={(props as any).items}
                      selectedIndex={selectedIndex}
                      onSelect={(command) => {
                        (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command } })
                      }}
                      query={(props as any).query}
                    />
                  )
                }
                return true
              }
              if (props.event.key === 'Enter') {
                const item = (props as any).items[selectedIndex]
                if (item) {
                  (props as any).command({ editor: (props as any).editor, range: (props as any).range, props: { command: item.command } })
                }
                return true
              }
              return false
            },
            
            // When slash command ends
            onExit: () => {
              if (root) {
                root.unmount()
              }
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup)
              }
            },
          }
        },
      }),
    ]
  },
});

export default SlashCommands; 