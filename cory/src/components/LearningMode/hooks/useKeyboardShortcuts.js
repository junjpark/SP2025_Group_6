import { useEffect } from 'react';

export const useKeyboardShortcuts = (onExit, viewMode, setTransparency) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onExit();
      } else if (viewMode === 'overlay') {
        // Arrow keys to adjust transparency in overlay mode
        if (event.key === 'ArrowUp') {
          setTransparency(prev => Math.min(1, prev + 0.1));
        } else if (event.key === 'ArrowDown') {
          setTransparency(prev => Math.max(0.1, prev - 0.1));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExit, viewMode, setTransparency]);
};
