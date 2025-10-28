import React from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';

const OverlayView = ({
  videoPlayerRef,
  attachWebcamMain,
  overlayOpacity,
  setTransparency,
  videoUrl,
  startTime,
  endTime,
  landmarks
}) => {
  return (
    <div className="overlay-mode">
      <div className="webcam-fullscreen">
        <video
          ref={attachWebcamMain}
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
