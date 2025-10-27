import React from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';

const FullView = ({
  videoPlayerRef,
  attachWebcamMain,
  isSwitched,
  videoUrl,
  startTime,
  endTime,
  landmarks
}) => {
  return (
    <div className="full-mode">
      {isSwitched ? (
        <div className="full-webcam">
          <video
            ref={attachWebcamMain}
            autoPlay
            muted
            playsInline
            className="webcam-video"
          />
        </div>
      ) : (
        <div className="full-dance">
          <CustomVideoPlayer
            ref={videoPlayerRef}
            url={videoUrl}
            start={startTime}
            end={endTime}
            landmarks={landmarks}
            isLearningMode={true}
            isLearningModePaused={false}
          />
        </div>
      )}
    </div>
  );
};

export default FullView;


