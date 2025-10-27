import React, { useRef, useState, useEffect } from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';

const PipView = ({
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
}) => {
  const pipRef = useRef(null);
  const [pipSize, setPipSize] = useState({ width: 300, height: 200 });
  const resizeStateRef = useRef({ isResizing: false, startX: 0, startY: 0, startW: 300, startH: 200 });
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const aspectInitializedRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizeStateRef.current.isResizing) return;
      const dx = e.clientX - resizeStateRef.current.startX;
      const dy = e.clientY - resizeStateRef.current.startY;
      const maxW = Math.min(window.innerWidth, 960);
      const maxH = Math.min(window.innerHeight, 720);
      const minH = 120;
      const minW = Math.max(160, Math.round(minH * aspectRatio));

      const startW = resizeStateRef.current.startW;
      const startH = resizeStateRef.current.startH;
      const aspect = aspectRatio || (startW / startH);

      // Proportional scaling based on dominant normalized delta; top-left handle, bottom-right anchored
      const normDx = dx / startW;
      const normDy = dy / startH;
      let scale = 1 - Math.max(normDx, normDy);

      // Compute desired size
      let desiredW = startW * scale;
      let desiredH = Math.round(desiredW / aspect);

      // Clamp while preserving aspect ratio
      // First clamp width
      desiredW = Math.max(minW, Math.min(desiredW, maxW));
      desiredH = Math.round(desiredW / aspect);
      // Then ensure height bounds
      if (desiredH < minH) {
        desiredH = minH;
        desiredW = Math.round(desiredH * aspect);
      } else if (desiredH > maxH) {
        desiredH = maxH;
        desiredW = Math.round(desiredH * aspect);
      }

      setPipSize({ width: desiredW, height: desiredH });
    };

    const onMouseUp = () => {
      if (resizeStateRef.current.isResizing) {
        resizeStateRef.current.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onResizeMouseDown = (e) => {
    e.preventDefault();
    resizeStateRef.current = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: pipSize.width,
      startH: pipSize.height
    };
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  // Initialize PIP height from webcam aspect ratio once when known
  useEffect(() => {
    if (!aspectInitializedRef.current && webcamAspectRatio && webcamAspectRatio > 0) {
      aspectInitializedRef.current = true;
      setAspectRatio(webcamAspectRatio);
      setPipSize((prev) => ({ width: prev.width, height: Math.round(prev.width / webcamAspectRatio) }));
    }
  }, [webcamAspectRatio]);
  return (
    <>
      <div className={`main-video-area ${isSwitched ? 'webcam-main' : 'dance-main'}`}>
        {isSwitched ? (
          // Webcam as main video
          <div className="webcam-container">
            <video
              ref={attachWebcamMain}
              autoPlay
              muted
              playsInline
              className="webcam-video"
            />
          </div>
        ) : (
          // Dance video as main
          <CustomVideoPlayer
            ref={videoPlayerRef}
            url={videoUrl}
            start={startTime}
            end={endTime}
            landmarks={landmarks}
            isLearningMode={true}
            isLearningModePaused={false}
          />
        )}
      </div>

      {/* Picture-in-Picture Area - Small overlay in bottom-right */}
      {isWebcamActive && (
        <div
          ref={pipRef}
          className={`pip-area ${isSwitched ? 'dance-pip' : 'webcam-pip'}`}
          style={{ width: `${pipSize.width}px`, height: `${pipSize.height}px` }}
        >
          {isSwitched ? (
            // Dance video as PIP
            <CustomVideoPlayer
              ref={videoPlayerRef}
              url={videoUrl}
              start={startTime}
              end={endTime}
              landmarks={landmarks}
              isLearningMode={true}
              isLearningModePaused={false}
            />
          ) : (
            // Webcam as PIP
            <div className="webcam-pip-container">
              <video
                ref={attachWebcamPip}
                autoPlay
                muted
                playsInline
                className="webcam-pip-video"
              />
            </div>
          )}
          <div
            className="pip-resize-handle"
            onMouseDown={onResizeMouseDown}
            title="Drag to resize"
          />
        </div>
      )}
    </>
  );
};

export default PipView;
