import React from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { 
  Heading1, 
  Heading2, 
  List, 
  Code, 
  Zap,
  Check
} from 'lucide-react';

interface SlashCommandProps {
  items: Array<{
    title: string;
    command: string;
    icon?: React.ReactNode;
    description?: string;
  }>;
  selectedIndex: number;
  onSelect: (command: string) => void;
  query?: string;
}

const getCommandIcon = (title: string) => {
  switch (title) {
    case 'Heading':
      return <Heading1 className="w-4 h-4" />;
    case 'Subheading':
      return <Heading2 className="w-4 h-4" />;
    case 'Bullet List':
      return <List className="w-4 h-4" />;
    case 'Code Block':
      return <Code className="w-4 h-4" />;
    case 'Monaco Editor':
      return <Zap className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const getCommandColor = (title: string) => {
  switch (title) {
    case 'Heading':
      return 'bg-blue-500';
    case 'Subheading':
      return 'bg-green-500';
    case 'Bullet List':
      return 'bg-purple-500';
    case 'Code Block':
      return 'bg-orange-500';
    case 'Monaco Editor':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const SlashCommand: React.FC<SlashCommandProps> = ({
  items,
  selectedIndex,
  onSelect,
  query
}) => {
  console.log('SlashCommand component rendered with:', { items, selectedIndex, query })
  
  return (
    <div 
      className="bg-white border-2 border-gray-300 rounded-xl shadow-2xl min-w-[280px] max-h-[400px] overflow-hidden" 
      style={{ 
        backgroundColor: 'white',
        border: '2px solid #d1d5db',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        minWidth: '280px',
        maxHeight: '400px',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(to right, #f9fafb, #f3f4f6)'
        }}
      >
        <div 
          className="flex items-center gap-3"
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div 
            className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            /
          </div>
          <div>
            <div 
              className="font-semibold text-gray-900 text-sm"
              style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}
            >
              Commands
            </div>
            <div 
              className="text-xs text-gray-500"
              style={{ fontSize: '12px', color: '#6b7280' }}
            >
              {query ? `Filtering: "${query}"` : 'Type to filter commands'}
            </div>
            {query && (
              <div 
                className="text-xs text-blue-600 font-mono mt-1"
                style={{ fontSize: '12px', color: '#2563eb', fontFamily: 'monospace', marginTop: '4px' }}
              >
                /{query}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command list */}
      <div className="max-h-[320px] overflow-y-auto">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={item.title}
              onClick={() => onSelect(item.command)}
              className={cn(
                "px-4 py-3 cursor-pointer transition-all duration-150 border-l-4",
                index === selectedIndex 
                  ? "bg-blue-50 border-blue-500 shadow-sm" 
                  : "border-transparent hover:bg-gray-50 hover:border-gray-200"
              )}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderLeft: `4px solid ${index === selectedIndex ? '#3b82f6' : 'transparent'}`,
                background: index === selectedIndex ? '#eff6ff' : 'transparent',
                boxShadow: index === selectedIndex ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <div 
                className="flex items-center gap-3"
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div 
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                    getCommandColor(item.title)
                  )}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    backgroundColor: getCommandColor(item.title).replace('bg-', '').includes('blue') ? '#3b82f6' :
                                   getCommandColor(item.title).replace('bg-', '').includes('green') ? '#10b981' :
                                   getCommandColor(item.title).replace('bg-', '').includes('purple') ? '#8b5cf6' :
                                   getCommandColor(item.title).replace('bg-', '').includes('orange') ? '#f59e0b' :
                                   getCommandColor(item.title).replace('bg-', '').includes('red') ? '#ef4444' : '#6b7280'
                  }}
                >
                  {getCommandIcon(item.title)}
                </div>
                <div 
                  className="flex-1"
                  style={{ flex: '1' }}
                >
                  <div 
                    className="font-semibold text-gray-900 text-sm"
                    style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}
                  >
                    {item.title}
                  </div>
                  <div 
                    className="text-xs text-gray-500 mt-0.5"
                    style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}
                  >
                    {item.description || `Add a ${item.title.toLowerCase()}`}
                  </div>
                </div>
                {index === selectedIndex && (
                  <div 
                    className="text-blue-500"
                    style={{ color: '#3b82f6' }}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-400 text-sm">No commands found</div>
            <div className="text-xs text-gray-300 mt-1">Try a different search term</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-2 border-t border-gray-100 bg-gray-50"
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          className="flex items-center justify-between text-xs text-gray-500"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6b7280'
          }}
        >
          <div 
            className="flex items-center gap-4"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}; 