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

const LearningMode = ({ 
  videoUrl, 
  startTime, 
  endTime, 
  landmarks, 
  onExit 
}) => {
  const videoPlayerRef = useRef(null);
  const { webcamMainRef, webcamPipRef, isWebcamActive, attachWebcamMain, attachWebcamPip } = useWebcam();
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

  useKeyboardShortcuts(onExit, viewMode, setTransparency);

  const renderViewMode = () => {
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
      landmarks
    };

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
      {renderViewMode()}
    </div>
  );
};

export default LearningMode;