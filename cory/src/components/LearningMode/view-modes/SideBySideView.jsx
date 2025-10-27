import React from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';

const SideBySideView = ({
  videoPlayerRef,
  webcamMainRef,
  webcamPipRef,
  attachWebcamMain,
  isSwitched,
  isWebcamActive,
  videoUrl,
  startTime,
  endTime,
  landmarks
}) => {
  return (
    <div className="sidebyside-mode">
      <div className={`sidebyside-left ${isSwitched ? 'dance-side' : 'webcam-side'}`}>
        <div className="video-label">{isSwitched ? 'Dance Video' : 'Webcam'}</div>
        {isSwitched ? (
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
          <video
            ref={attachWebcamMain}
            autoPlay
            muted
            playsInline
            className="webcam-video"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              transform: 'scaleX(-1)'
            }}
          />
        )}
      </div>
      
      <div className={`sidebyside-right ${isSwitched ? 'webcam-side' : 'dance-side'}`}>
        <div className="video-label">{isSwitched ? 'Webcam' : 'Dance Video'}</div>
        {isSwitched ? (
          <video
            ref={attachWebcamMain}
            autoPlay
            muted
            playsInline
            className="webcam-video"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              transform: 'scaleX(-1)'
            }}
          />
        ) : (
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
    </div>
  );
};

export default SideBySideView;
