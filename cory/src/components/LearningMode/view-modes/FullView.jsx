import React from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';
import WebcamCanvas from '../WebcamCanvas';

const FullView = ({
  videoPlayerRef,
  webcamStream,
  isSwitched,
  videoUrl,
  startTime,
  endTime
}) => {
  return (
    <div className="full-mode">
      {isSwitched ? (
        <div className="full-webcam">
          <WebcamCanvas
            webcamStream={webcamStream}
            isActive={true}
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
          />
        </div>
      )}
    </div>
  );
};

export default FullView;


