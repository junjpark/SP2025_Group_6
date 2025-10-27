import React from 'react';
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
  landmarks
}) => {
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
        <div className={`pip-area ${isSwitched ? 'dance-pip' : 'webcam-pip'}`}>
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
        </div>
      )}
    </>
  );
};

export default PipView;
