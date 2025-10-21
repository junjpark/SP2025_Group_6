import React, { useEffect, useRef, useState } from 'react';
import CustomVideoPlayer from '../CustomVideoPlayer';
import './LearningMode.css';

const LearningMode = ({ 
  videoUrl, 
  startTime, 
  endTime, 
  landmarks, 
  onExit 
}) => {
  const videoPlayerRef = useRef(null);
  const webcamMainRef = useRef(null);  // Separate ref for main webcam
  const webcamPipRef = useRef(null);   // Separate ref for PIP webcam
  const [webcamStream, setWebcamStream] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isSwitched, setIsSwitched] = useState(false); // Toggle between webcam/dance as main video

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExit]);

  // Initialize webcam
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false 
        });
        setWebcamStream(stream);
        setIsWebcamActive(true);
      } catch (error) {
        console.error('Error accessing webcam:', error);
        // Continue without webcam if permission denied
      }
    };

    initWebcam();

    // Cleanup webcam stream on unmount
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Assign stream to video elements whenever stream or switching changes
  // This prevents black screen when switching between main/PIP webcam views
  useEffect(() => {
    if (webcamStream) {
      if (webcamMainRef.current) {
        webcamMainRef.current.srcObject = webcamStream;
      }
      if (webcamPipRef.current) {
        webcamPipRef.current.srcObject = webcamStream;
      }
    }
  }, [webcamStream, isSwitched]);

  const toggleVideoSwitch = () => {
    setIsSwitched(!isSwitched);
  };

  return (
    <div className="learning-mode-container">
      <button 
        className="exit-learning-btn"
        onClick={onExit}
        title="Exit Learning Mode (Press ESC)"
      >
        ✕
      </button>

      <button 
        className="switch-video-btn"
        onClick={toggleVideoSwitch}
        title="Switch Main Video"
      >
        🔄
      </button>
      
      {/* Main Video Area - Full screen display */}
      <div className={`main-video-area ${isSwitched ? 'webcam-main' : 'dance-main'}`}>
        {isSwitched ? (
          // Webcam as main video
          <div className="webcam-container">
            <video
              ref={webcamMainRef}
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
                ref={webcamPipRef}
                autoPlay
                muted
                playsInline
                className="webcam-pip-video"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningMode;
