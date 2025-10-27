import React from 'react';
import { MdSwapHoriz } from 'react-icons/md';
import { VIEW_MODES } from '../constants/viewModes';
import { VIEW_MODE_CONFIG } from '../constants/viewModes';

const ControlButtons = ({
  viewMode,
  isSwitched,
  toggleVideoSwitch,
  setViewModePip,
  setViewModeOverlay,
  setViewModeSideBySide,
  setViewModeFull,
  onExit
}) => {
  const getTitle = () => {
    if (viewMode === VIEW_MODES.SIDE_BY_SIDE) return 'Switch Webcam/Dance Video Sides';
    if (viewMode === VIEW_MODES.FULL) return 'Switch Full Screen Video';
    return 'Switch Main Video';
  };

  return (
    <>
      <button 
        className="exit-learning-btn"
        onClick={onExit}
        title="Exit Learning Mode (Press ESC)"
      >
        ✕
      </button>

      <button 
        className={`switch-video-btn ${viewMode === 'sidebyside' ? 'sidebyside-switch' : viewMode === 'full' ? 'full-switch' : ''}`}
        onClick={toggleVideoSwitch}
        title={getTitle()}
      >
        <MdSwapHoriz size={18} />
      </button>

      {/* View Mode Buttons */}
      <button 
        className={`view-mode-btn ${viewMode === VIEW_MODES.PIP ? 'active' : ''}`}
        onClick={setViewModePip}
        title={VIEW_MODE_CONFIG[VIEW_MODES.PIP].title}
      >
        <img src={VIEW_MODE_CONFIG[VIEW_MODES.PIP].icon} alt="PIP" width="16" height="16" />
      </button>
      
      <button 
        className={`view-mode-btn ${viewMode === VIEW_MODES.OVERLAY ? 'active' : ''}`}
        onClick={setViewModeOverlay}
        title={VIEW_MODE_CONFIG[VIEW_MODES.OVERLAY].title}
      >
        <img src={VIEW_MODE_CONFIG[VIEW_MODES.OVERLAY].icon} alt="Overlay" width="16" height="16" />
      </button>
      
      <button 
        className={`view-mode-btn ${viewMode === VIEW_MODES.SIDE_BY_SIDE ? 'active' : ''}`}
        onClick={setViewModeSideBySide}
        title={VIEW_MODE_CONFIG[VIEW_MODES.SIDE_BY_SIDE].title}
      >
        <img src={VIEW_MODE_CONFIG[VIEW_MODES.SIDE_BY_SIDE].icon} alt="Side-by-Side" width="16" height="16" />
      </button>
      
      <button 
        className={`view-mode-btn ${viewMode === VIEW_MODES.FULL ? 'active' : ''}`}
        onClick={setViewModeFull}
        title={VIEW_MODE_CONFIG[VIEW_MODES.FULL].title}
      >
        <img src={VIEW_MODE_CONFIG[VIEW_MODES.FULL].icon} alt="Full Screen" width="16" height="16" />
      </button>
    </>
  );
};

export default ControlButtons;
