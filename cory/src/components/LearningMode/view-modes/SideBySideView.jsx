import React, { useEffect } from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';
import WebcamCanvas from '../WebcamCanvas';
import { useReferencePoseLandmarks } from '../hooks/useReferencePoseLandmarks';

const SideBySideView = ({
  videoPlayerRef,
  attachWebcamMain,
  webcamStream,
  isSwitched,
  videoUrl,
  projectId,
  startTime,
  endTime
}) => {
  // Debug props
  useEffect(() => {
    console.log('[SideBySideView] Props:', { projectId, videoUrl, hasVideoRef: !!videoPlayerRef.current });
  }, [projectId, videoUrl, videoPlayerRef]);

  // Fetch and sync landmarks from backend (pre-computed)
  const { currentPose: referencePose, loading, error, isReady } = useReferencePoseLandmarks(
    projectId,
    videoPlayerRef.current,
    true
  );
  
  // Debug reference pose
  useEffect(() => {
    console.log('[SideBySideView] Reference pose state:', { 
      hasReference: !!referencePose, 
      loading, 
      error, 
      isReady,
      landmarks: referencePose?.poseLandmarks?.length
    });
  }, [referencePose, loading, error, isReady]);
  
  return (
    <div className="sidebyside-mode">
      <div className={`sidebyside-left ${isSwitched ? 'dance-side' : 'webcam-side'}`}>
        {isSwitched ? (
          <CustomVideoPlayer
            ref={videoPlayerRef}
            url={videoUrl}
            start={startTime}
            end={endTime}
          />
        ) : (
          <WebcamCanvas
            webcamStream={webcamStream}
            isActive={true}
            referencePose={referencePose}
            referenceLoading={loading}
            referenceError={error}
            className="webcam-video"
          />
        )}
      </div>

      <div className={`sidebyside-right ${isSwitched ? 'webcam-side' : 'dance-side'}`}>
        {isSwitched ? (
          <WebcamCanvas
            webcamStream={webcamStream}
            isActive={true}
            referencePose={referencePose}
            referenceLoading={loading}
            referenceError={error}
            className="webcam-video"
          />
        ) : (
          <CustomVideoPlayer
            ref={videoPlayerRef}
            url={videoUrl}
            start={startTime}
            end={endTime}
          />
        )}
      </div>
    </div>
  );
};

export default SideBySideView;
