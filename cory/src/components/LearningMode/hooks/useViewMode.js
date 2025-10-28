import { useState } from 'react';
import { VIEW_MODES } from '../constants/viewModes';

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState(VIEW_MODES.PIP);
  const [isSwitched, setIsSwitched] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);

  const setViewModePip = () => {
    setViewMode(VIEW_MODES.PIP);
    console.log('Switching to PIP mode');
  };

  const setViewModeOverlay = () => {
    setViewMode(VIEW_MODES.OVERLAY);
    console.log('Switching to Overlay mode');
  };

  const setViewModeSideBySide = () => {
    setViewMode(VIEW_MODES.SIDE_BY_SIDE);
    console.log('Switching to Side-by-Side mode');
  };

  const setViewModeFull = () => {
    setViewMode(VIEW_MODES.FULL);
    console.log('Switching to Full mode');
  };

  const toggleVideoSwitch = () => {
    setIsSwitched(!isSwitched);
  };

  const setTransparency = (value) => {
    if (typeof value === 'function') {
      setOverlayOpacity(value);
    } else {
      setOverlayOpacity(value);
    }
  };

  return {
    viewMode,
    isSwitched,
    overlayOpacity,
    setViewModePip,
    setViewModeOverlay,
    setViewModeSideBySide,
    setViewModeFull,
    toggleVideoSwitch,
    setTransparency
  };
};
