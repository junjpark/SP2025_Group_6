import React, { useRef } from 'react';
import CustomVideoPlayer from '../CustomVideoPlayer';
import { useWebcam } from './hooks/useWebcam';
import { useViewMode } from './hooks/useViewMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ControlButtons from './controls/ControlButtons';
import PipView from './view-modes/PipView';
import OverlayView from './view-modes/OverlayView';
import SideBySideView from './view-modes/SideBySideView';
import FullView from './view-modes/FullView';
import { VIEW_MODES } from './constants/viewModes';
import './LearningMode.css';

// LearningMode renders the full-screen practice experience and switches
// between different layout "view modes" (PIP, Overlay, Side-by-Side, Full).
// It wires up webcam access, keyboard shortcuts, and passes a common set
// of props down to the specific view components.

/**
 * LearningMode
 * @param {string} videoUrl - URL blob for the dance video to practice with
 * @param {number} startTime - clip start (seconds)
 * @param {number} endTime - clip end (seconds)
 * @param {any} landmarks - pose landmarks for overlay rendering (if available)
 * @param {() => void} onExit - callback when the user exits learning mode
 */
const LearningMode = ({ 
  videoUrl, 
  startTime, 
  endTime, 
  landmarks, 
  onExit 
}) => {
  // Ref for the primary CustomVideoPlayer instance used across views
  const videoPlayerRef = useRef(null);

  // Webcam hook exposes refs and safe callback ref binders which ensure
  // the MediaStream is reattached whenever the underlying <video> node remounts.
  // It also provides the detected webcam aspect ratio for PIP sizing.
  const { 
    webcamMainRef, 
    webcamPipRef, 
    isWebcamActive, 
    attachWebcamMain, 
    attachWebcamPip, 
    webcamAspectRatio 
  } = useWebcam();
  const {
    viewMode,
    isSwitched,
    overlayOpacity,
    setViewModePip,
    setViewModeOverlay,
    setViewModeSideBySide,
    setViewModeFull,
    toggleVideoSwitch,
    setTransparency
  } = useViewMode();

  // Global keyboard UX for learning mode (e.g., ESC to exit, arrow keys to adjust overlay)
  useKeyboardShortcuts(onExit, viewMode, setTransparency);

  const renderViewMode = () => {
    // Common props shared across all view components to keep their APIs aligned.
    const commonProps = {
      videoPlayerRef,
      webcamMainRef,
      webcamPipRef,
      attachWebcamMain,
      attachWebcamPip,
      isSwitched,
      isWebcamActive,
      videoUrl,
      startTime,
      endTime,
      landmarks,
      webcamAspectRatio
    };

    // Delegate rendering to the active view mode; default to PIP for safety.
    switch (viewMode) {
      case VIEW_MODES.PIP:
        return <PipView {...commonProps} />;
      case VIEW_MODES.OVERLAY:
        return <OverlayView {...commonProps} overlayOpacity={overlayOpacity} setTransparency={setTransparency} />;
      case VIEW_MODES.SIDE_BY_SIDE:
        return <SideBySideView {...commonProps} />;
      case VIEW_MODES.FULL:
        return <FullView {...commonProps} />;
      default:
        return <PipView {...commonProps} />;
    }
  };

  return (
    <div className="learning-mode-container">
      {/* Floating control cluster: exit, switch, and view mode selectors */}
      <ControlButtons
        viewMode={viewMode}
        isSwitched={isSwitched}
        toggleVideoSwitch={toggleVideoSwitch}
        setViewModePip={setViewModePip}
        setViewModeOverlay={setViewModeOverlay}
        setViewModeSideBySide={setViewModeSideBySide}
        setViewModeFull={setViewModeFull}
        onExit={onExit}
      />
      {/* Active view mode content */}
      {renderViewMode()}
    </div>
  );
};

export default LearningMode;