import React, { useEffect } from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';
import WebcamCanvas from '../WebcamCanvas';
import { useReferencePoseLandmarks } from '../hooks/useReferencePoseLandmarks';

const OverlayView = ({
  videoPlayerRef,
  attachWebcamMain,
  webcamStream,
  overlayOpacity,
  setTransparency,
  videoUrl,
  projectId,
  startTime,
  endTime
}) => {
  // Debug props
  useEffect(() => {
    console.log('[OverlayView] Props:', { projectId, videoUrl, hasVideoRef: !!videoPlayerRef.current });
  }, [projectId, videoUrl, videoPlayerRef]);

  // Fetch and sync landmarks from backend (pre-computed)
  const { currentPose: referencePose, loading, error, isReady } = useReferencePoseLandmarks(
    projectId,
    videoPlayerRef.current,
    true
  );
  
  // Debug reference pose
  useEffect(() => {
    console.log('[OverlayView] Reference pose state:', { 
      hasReference: !!referencePose, 
      loading, 
      error, 
      isReady,
      landmarks: referencePose?.poseLandmarks?.length
    });
  }, [referencePose, loading, error, isReady]);
  
  return (
    <div className="overlay-mode">
      <div className="webcam-fullscreen">
        <WebcamCanvas
          webcamStream={webcamStream}
          isActive={true}
          referencePose={referencePose}
          referenceLoading={loading}
          referenceError={error}
          className="webcam-video"
          style={{
            objectFit: 'cover'
          }}
        />
      </div>

      <div
        className="dance-overlay"
        style={{ opacity: overlayOpacity }}
      >
        <CustomVideoPlayer
          ref={videoPlayerRef}
          url={videoUrl}
          start={startTime}
          end={endTime}
        />
      </div>

      {/* Transparency Slider */}
      <div
        className="transparency-slider"
        title="Use ↑/↓ arrow keys for quick adjustment"
      >
        <label htmlFor="overlay-transparency">Overlay Transparency</label>
        <input
          id="overlay-transparency"
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={overlayOpacity}
          onChange={(e) => setTransparency(parseFloat(e.target.value))}
          title="Drag to adjust transparency or use ↑/↓ arrow keys"
        />
        <div className="transparency-percentage">
          {Math.round(overlayOpacity * 100)}%
        </div>
      </div>
    </div>
  );
};

export default OverlayView;
