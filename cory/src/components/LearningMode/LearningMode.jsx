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
  const [viewMode, setViewMode] = useState('pip'); // 'pip', 'overlay', 'sidebyside', or 'full' - Controls display layout
  const [overlayOpacity, setOverlayOpacity] = useState(0.7); // Transparency level for dance video overlay

  // Handle ESC key to exit and arrow keys for transparency
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onExit();
      } else if (viewMode === 'overlay') {
        // Arrow keys to adjust transparency in overlay mode
        if (event.key === 'ArrowUp') {
          setOverlayOpacity(prev => Math.min(1, prev + 0.1));
        } else if (event.key === 'ArrowDown') {
          setOverlayOpacity(prev => Math.max(0.1, prev - 0.1));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExit, viewMode]);

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

  // Assign stream to video elements whenever stream, switching, or view mode changes
  // This prevents black screen when switching between main/PIP webcam views
  useEffect(() => {
    console.log('Stream assignment effect triggered:', {
      hasStream: !!webcamStream,
      hasMainRef: !!webcamMainRef.current,
      hasPipRef: !!webcamPipRef.current,
      viewMode,
      isSwitched
    });
    
    if (webcamStream) {
      if (webcamMainRef.current) {
        webcamMainRef.current.srcObject = webcamStream;
        console.log('Assigned stream to main webcam');
      }
      if (webcamPipRef.current) {
        webcamPipRef.current.srcObject = webcamStream;
        console.log('Assigned stream to PIP webcam');
      }
    }
  }, [webcamStream, isSwitched, viewMode]);

  const toggleVideoSwitch = () => {
    setIsSwitched(!isSwitched);
  };

  const setViewModePip = () => {
    setViewMode('pip');
    console.log('Switching to PIP mode');
  };

  const setViewModeOverlay = () => {
    setViewMode('overlay');
    console.log('Switching to Overlay mode');
  };

  const setViewModeSideBySide = () => {
    setViewMode('sidebyside');
    console.log('Switching to Side-by-Side mode');
  };

  const setViewModeFull = () => {
    setViewMode('full');
    console.log('Switching to Full mode');
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
        className={`switch-video-btn ${viewMode === 'sidebyside' ? 'sidebyside-switch' : viewMode === 'full' ? 'full-switch' : ''}`}
        onClick={toggleVideoSwitch}
        title={viewMode === 'sidebyside' ? 'Switch Webcam/Dance Video Sides' : viewMode === 'full' ? 'Switch Full Screen Video' : 'Switch Main Video'}
      >
        Switch
      </button>

      {/* View Mode Buttons */}
      <button 
        className={`view-mode-btn ${viewMode === 'pip' ? 'active' : ''}`}
        onClick={setViewModePip}
        title="Picture-in-Picture Mode"
      >
        PIP
      </button>

      <button 
        className={`view-mode-btn ${viewMode === 'overlay' ? 'active' : ''}`}
        onClick={setViewModeOverlay}
        title="Overlay Mode"
      >
        Overlay
      </button>

      <button 
        className={`view-mode-btn ${viewMode === 'sidebyside' ? 'active' : ''}`}
        onClick={setViewModeSideBySide}
        title="Side-by-Side Mode"
      >
        Side
      </button>

      <button 
        className={`view-mode-btn ${viewMode === 'full' ? 'active' : ''}`}
        onClick={setViewModeFull}
        title="Full Screen Mode"
      >
        Full
      </button>
      
      {/* Main Video Area - Full screen display */}
      {viewMode === 'pip' ? (
        // PIP Mode Layout
        <>
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
        </>
      ) : viewMode === 'overlay' ? (
        // Overlay Mode Layout - Webcam full screen with transparent dance video overlay
        <div className="overlay-mode">
          <div className="webcam-fullscreen">
            <video
              ref={webcamMainRef}
              autoPlay
              muted
              playsInline
              className="webcam-video"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: 'scaleX(-1)'
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
              landmarks={landmarks}
              isLearningMode={true}
              isLearningModePaused={false}
            />
          </div>
          
          {/* Transparency Slider */}
          <div 
            className="transparency-slider"
            title="Use ↑/↓ arrow keys for quick adjustment"
          >
            <label>Overlay Transparency</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              title="Drag to adjust transparency or use ↑/↓ arrow keys"
            />
            <div className="transparency-percentage">
              {Math.round(overlayOpacity * 100)}%
            </div>
          </div>
        </div>
      ) : viewMode === 'sidebyside' ? (
        // Side-by-Side Mode Layout - Webcam and dance video side by side
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
                ref={webcamMainRef}
                autoPlay
                muted
                playsInline
                className="webcam-video"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            )}
          </div>
          <div className={`sidebyside-right ${isSwitched ? 'webcam-side' : 'dance-side'}`}>
            <div className="video-label">{isSwitched ? 'Webcam' : 'Dance Video'}</div>
            {isSwitched ? (
              <video
                ref={webcamMainRef}
                autoPlay
                muted
                playsInline
                className="webcam-video"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
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
      ) : (
        // Full Mode Layout - Single video takes up whole screen
        <div className="full-mode">
          {isSwitched ? (
            // Webcam full screen
            <div className="full-webcam">
              <div className="video-label">Webcam</div>
              <video
                ref={webcamMainRef}
                autoPlay
                muted
                playsInline
                className="webcam-video"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            </div>
          ) : (
            // Dance video full screen
            <div className="full-dance">
              <div className="video-label">Dance Video</div>
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
      )}
    </div>
  );
};

export default LearningMode;
