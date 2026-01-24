import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onEscape?: () => void;
  onViewChange?: (view: string) => void;
  onTogglePhaseList?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onEscape,
  onViewChange,
  onTogglePhaseList,
  enabled = true,
}: KeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape key - close drawers/modals
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Ctrl/Cmd + K - toggle phase list
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (onTogglePhaseList) {
          onTogglePhaseList();
        }
        return;
      }

      // Number keys 1-6 for view switching (only if not holding modifier keys)
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        if (onViewChange) {
          switch (event.key) {
            case '1':
              event.preventDefault();
              onViewChange('action');
              break;
            case '2':
              event.preventDefault();
              onViewChange('pending');
              break;
            case '3':
              event.preventDefault();
              onViewChange('chart');
              break;
            case '4':
              event.preventDefault();
              onViewChange('companies');
              break;
            case '5':
              event.preventDefault();
              onViewChange('economy');
              break;
            case '6':
              event.preventDefault();
              onViewChange('operations');
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onEscape, onViewChange, onTogglePhaseList]);
};

