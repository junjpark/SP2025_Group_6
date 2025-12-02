import React, { useEffect, useRef } from 'react';
import { useMediaPipePose } from './hooks/useMediaPipePose.jsx';

/**
 * WebcamCanvas component that displays webcam feed with pose landmarks
 * @param {MediaStream|null} webcamStream - The webcam video stream
 * @param {boolean} isActive - Whether pose detection should be active
 * @param {Object|null} referencePose - Optional reference pose for angle comparison
 * @param {string} className - CSS class name for the canvas
 * @param {Object} style - Inline styles for the canvas
 */
const WebcamCanvas = ({
  webcamStream,
  isActive = true,
  referencePose = null,
  referenceLoading = false,
  referenceError = null,
  className = 'webcam-video',
  style = {}
}) => {
  const { canvasRef, videoRef, comparisonScore } = useMediaPipePose(webcamStream, isActive, referencePose);
  const containerRef = useRef(null);

  useEffect(() => {
    // Force canvas to have proper initial size
    const forceCanvasSize = () => {
      if (canvasRef.current && videoRef.current) {
        const video = videoRef.current;

        // Wait for video to have dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
          console.log('[WebcamCanvas] Forced canvas size to video:', video.videoWidth, 'x', video.videoHeight);
        } else {
          // Set a reasonable default size if video not ready
          canvasRef.current.width = 1280;
          canvasRef.current.height = 720;
          console.log('[WebcamCanvas] Set default canvas size: 1280x720');
        }
      }

      if (canvasRef.current && containerRef.current) {
        console.log('[WebcamCanvas] Canvas status:', {
          internalSize: `${canvasRef.current.width}x${canvasRef.current.height}`,
          displaySize: `${canvasRef.current.offsetWidth}x${canvasRef.current.offsetHeight}`,
          containerSize: `${containerRef.current.offsetWidth}x${containerRef.current.offsetHeight}`,
          canvasVisible: canvasRef.current.offsetParent !== null
        });
      }
    };

    // Try immediately
    forceCanvasSize();

    // Try again after delays to catch video load
    const timer1 = setTimeout(forceCanvasSize, 100);
    const timer2 = setTimeout(forceCanvasSize, 500);
    const timer3 = setTimeout(forceCanvasSize, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [canvasRef, videoRef, containerRef, webcamStream]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Hidden video element for MediaPipe processing */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        muted
        playsInline
      />
      {/* Visible canvas element showing pose landmarks */}
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none',
          ...style
        }}
      />
      {/* Score Display Overlay - ALWAYS VISIBLE FOR DEBUGGING */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '15px 25px',
        borderRadius: '12px',
        border: `3px solid ${comparisonScore >= 80 ? '#00FF00' : comparisonScore >= 60 ? '#FFA500' : '#FF0000'}`,
        backdropFilter: 'blur(10px)',
        pointerEvents: 'none',
        minWidth: '150px'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#ccc',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '5px',
          textAlign: 'center'
        }}>
          Match Score
        </div>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: comparisonScore >= 80 ? '#00FF00' : comparisonScore >= 60 ? '#FFA500' : comparisonScore > 0 ? '#FF0000' : '#888',
          textAlign: 'center',
          lineHeight: '1'
        }}>
          {comparisonScore || '--'}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#aaa',
          textAlign: 'center',
          marginTop: '5px'
        }}>
          {!referencePose ? 'No Reference' :
            comparisonScore === 0 ? 'Detecting...' :
              comparisonScore >= 90 ? 'Perfect!' :
                comparisonScore >= 80 ? 'Excellent!' :
                  comparisonScore >= 70 ? 'Great!' :
                    comparisonScore >= 60 ? 'Good!' :
                      'Keep Trying!'}
        </div>
        {/* Debug info */}
        <div style={{
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
          marginTop: '8px',
          borderTop: '1px solid #444',
          paddingTop: '5px'
        }}>
          Ref: {referencePose ? '✓' : '✗'} | Score: {comparisonScore}
        </div>
      </div>

      {/* Processing Reference Video Overlay */}
      {referenceLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15,
          background: 'rgba(0, 0, 0, 0.95)',
          padding: '30px 50px',
          borderRadius: '20px',
          border: '3px solid #9333EA',
          backdropFilter: 'blur(15px)',
          textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)'
        }}>
          {/* Spinner */}
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(147, 51, 234, 0.3)',
            borderTop: '5px solid #9333EA',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '10px'
          }}>
            Processing Reference Video...
          </div>
          <div style={{
            fontSize: '14px',
            color: '#aaa'
          }}>
            Extracting pose landmarks
          </div>
        </div>
      )}

      {/* Reference Error Overlay */}
      {referenceError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15,
          background: 'rgba(0, 0, 0, 0.95)',
          padding: '30px 50px',
          borderRadius: '20px',
          border: '3px solid #FF0000',
          backdropFilter: 'blur(15px)',
          textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{
            fontSize: '40px',
            marginBottom: '15px'
          }}>
            ⚠️
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FF6347',
            marginBottom: '10px'
          }}>
            Reference Processing Failed
          </div>
          <div style={{
            fontSize: '13px',
            color: '#aaa',
            maxWidth: '300px'
          }}>
            {referenceError}
          </div>
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Debug Panel - Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '12px 18px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        lineHeight: '1.6'
      }}>
        <div style={{ color: webcamStream ? '#0f0' : '#f00' }}>
          Webcam: {webcamStream ? '✓' : '✗'}
        </div>
        <div style={{ color: isActive ? '#0f0' : '#f00' }}>
          Active: {isActive ? '✓' : '✗'}
        </div>
        <div style={{ color: referencePose ? '#0f0' : '#f00' }}>
          Reference: {referencePose ? '✓' : '✗'}
        </div>
        <div style={{ color: referencePose?.poseLandmarks ? '#0f0' : '#f00' }}>
          Landmarks: {referencePose?.poseLandmarks?.length || 0}
        </div>
        <div style={{ borderTop: '1px solid #444', marginTop: '5px', paddingTop: '5px' }}>
          Score: {comparisonScore}/100
        </div>
      </div>
    </div>
  );
};

export default WebcamCanvas;

