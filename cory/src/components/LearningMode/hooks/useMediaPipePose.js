import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for real-time pose detection on webcam feed using TensorFlow.js
 * @param {MediaStream|null} webcamStream - The webcam video stream
 * @param {boolean} isActive - Whether pose detection should be active
 * @param {Object|null} referencePose - Optional reference pose for angle comparison
 * @returns {Object} - Contains canvasRef for rendering and poseResults
 */
export const useMediaPipePose = (webcamStream, isActive, referencePose = null) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const poseRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [poseResults, setPoseResults] = useState(null);
  const [comparisonScore, setComparisonScore] = useState(0);
  const referencePoseRef = useRef(referencePose);

  // Update reference pose ref when it changes
  useEffect(() => {
    referencePoseRef.current = referencePose;
  }, [referencePose]);

  // Helper functions for angle comparison
  const calculateLineAngle = (point1, point2) => {
    // Calculate angle in degrees (0-360)
    const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
    return angle;
  };

  const angleDifference = (angle1, angle2) => {
    // Calculate the smallest difference between two angles
    let diff = Math.abs(angle1 - angle2);
    // Handle wraparound (e.g., 350° vs 10° should be 20°, not 340°)
    if (diff > 180) diff = 360 - diff;
    return diff;
  };

  const getColorForAngleDiff = (diff) => {
    // Perfect match (0-15 degrees): Green
    // Good match (15-30 degrees): Yellow/Orange  
    // Poor match (30+ degrees): Red

    if (diff <= 15) {
      // Green to Yellow-Green gradient
      const ratio = diff / 15;
      return {
        r: Math.round(255 * ratio),
        g: 255,
        b: 0
      };
    } else if (diff <= 30) {
      // Yellow to Red gradient
      const ratio = (diff - 15) / 15;
      return {
        r: 255,
        g: Math.round(255 * (1 - ratio)),
        b: 0
      };
    } else {
      // Pure red for large differences
      return { r: 255, g: 0, b: 0 };
    }
  };

  // Initialize MediaPipe Pose from CDN
  useEffect(() => {
    if (!isActive) {
      console.log('[PoseDetection] Not active, skipping initialization');
      return;
    }

    const initializePose = async () => {
      try {
        console.log('[PoseDetection] Loading MediaPipe from CDN...');

        // Load MediaPipe from CDN
        if (!window.Pose) {
          await loadMediaPipeScript();
        }

        console.log('[PoseDetection] Creating Pose instance...');
        const pose = new window.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          setPoseResults(results);
          drawPoseResults(results);
        });

        poseRef.current = pose;
        setIsInitialized(true);
        console.log('[PoseDetection] MediaPipe initialization complete!');
      } catch (error) {
        console.error('[PoseDetection] Failed to initialize MediaPipe:', error);
        console.error('[PoseDetection] Error stack:', error.stack);
        setIsInitialized(false);
      }
    };

    initializePose();

    return () => {
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          console.warn('[PoseDetection] Error closing pose:', e);
        }
        poseRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsInitialized(false);
    };
  }, [isActive]);

  // Helper function to load MediaPipe scripts from CDN
  const loadMediaPipeScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Pose) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('[PoseDetection] MediaPipe script loaded');
        resolve();
      };
      script.onerror = (error) => {
        console.error('[PoseDetection] Failed to load MediaPipe script:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  };

  // Pose connections defined manually in drawPoseResults

  // Draw pose results on canvas
  const drawPoseResults = (results) => {
    try {
      if (!canvasRef.current) {
        console.warn('[PoseDetection] No canvas ref');
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match image
      if (results.image && canvas.width !== results.image.width) {
        canvas.width = results.image.width;
        canvas.height = results.image.height;
        console.log('[PoseDetection] Canvas resized to:', canvas.width, 'x', canvas.height);
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the video frame
      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      }

      // Draw pose landmarks
      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        const landmarks = results.poseLandmarks;
        const refPose = referencePoseRef.current;

        // Define connections (same as MediaPipe POSE_CONNECTIONS)
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
          [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
          [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [11, 23], [12, 24],
          [23, 24], [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
          [24, 26], [26, 28], [28, 30], [30, 32], [28, 32]
        ];

        ctx.save();

        // Calculate overall score
        let totalDiff = 0;
        let validConnections = 0;
        const segmentDetails = []; // For debugging

        // Draw connections with color based on angle matching
        connections.forEach(([i, j]) => {
          if (landmarks[i] && landmarks[j]) {
            const start = landmarks[i];
            const end = landmarks[j];

            if (start.visibility > 0.5 && end.visibility > 0.5) {
              const liveAngle = calculateLineAngle(
                { x: start.x, y: start.y },
                { x: end.x, y: end.y }
              );

              // Default color (red - no match)
              let color = { r: 255, g: 0, b: 0 };
              let diff = 90; // default large difference
              let hasReference = false;

              // If we have a reference pose, compare angles
              if (refPose && refPose.poseLandmarks) {
                const refLandmarks = refPose.poseLandmarks;
                if (refLandmarks[i] && refLandmarks[j]) {
                  const refStart = refLandmarks[i];
                  const refEnd = refLandmarks[j];

                  if (refStart.visibility > 0.5 && refEnd.visibility > 0.5) {
                    const refAngle = calculateLineAngle(
                      { x: refStart.x, y: refStart.y },
                      { x: refEnd.x, y: refEnd.y }
                    );

                    diff = angleDifference(liveAngle, refAngle);
                    color = getColorForAngleDiff(diff);
                    hasReference = true;

                    totalDiff += diff;
                    validConnections++;

                    // Store for debugging
                    segmentDetails.push({
                      segment: `${i}-${j}`,
                      liveAngle: liveAngle.toFixed(1),
                      refAngle: refAngle.toFixed(1),
                      diff: diff.toFixed(1),
                      color: `rgb(${color.r},${color.g},${color.b})`
                    });
                  }
                }
              }

              // Draw the line with appropriate color
              ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
              ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
              ctx.stroke();

              // Debug: Draw small circles at endpoints with text showing segment number
              if (hasReference && Math.random() < 0.1) { // Only log occasionally
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                const midX = (start.x + end.x) / 2 * canvas.width;
                const midY = (start.y + end.y) / 2 * canvas.height;
                ctx.fillText(`${diff.toFixed(0)}°`, midX, midY);
              }
            }
          }
        });

        // Log segment details occasionally for debugging
        if (validConnections > 0 && Math.random() < 0.02) {
          console.log('[PoseDetection] Segment comparison details:');
          console.table(segmentDetails.slice(0, 5)); // Show first 5 segments
          console.log(`Total segments compared: ${validConnections}/${connections.length}`);
        }

        // Calculate score (0-100)
        let score = 0;
        if (validConnections > 0) {
          const avgDiff = totalDiff / validConnections;
          // Convert average difference to score
          // 0° diff = 100, 15° diff = 83, 30° diff = 67, 45° diff = 50, 90° diff = 0
          score = Math.max(0, Math.min(100, 100 - (avgDiff / 90 * 100)));

          // Log score details
          if (Math.random() < 0.05) { // Log more frequently
            console.log(`[PoseDetection] ⭐ SCORE: ${score.toFixed(1)}/100 | Avg diff: ${avgDiff.toFixed(1)}° | Valid segments: ${validConnections}/${connections.length}`);
            console.log(`[PoseDetection] Has reference: ${!!refPose}, Has landmarks: ${!!refPose?.poseLandmarks}`);
          }
        } else {
          // No reference to compare against
          if (refPose && Math.random() < 0.05) {
            console.log('[PoseDetection] No valid connections for comparison');
          }
        }
        setComparisonScore(Math.round(score));

        // Draw landmarks (solid purple dots)
        landmarks.forEach((landmark) => {
          if (landmark.visibility > 0.5) {
            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;

            // Solid purple dot
            ctx.fillStyle = '#9333EA'; // Purple color
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        });

        ctx.restore();
      } else {
        console.log('[PoseDetection] No pose landmarks detected');
      }
    } catch (error) {
      console.error('[PoseDetection] Error drawing results:', error);
    }
  };

  // Process video frames - works even if pose detection isn't initialized
  useEffect(() => {
    if (!webcamStream || !isActive) {
      console.log('[PoseDetection] Frame processing not ready:', {
        hasWebcam: !!webcamStream,
        isActive
      });
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.log('[PoseDetection] No video element ref');
      return;
    }

    console.log('[PoseDetection] Setting up video stream');
    video.srcObject = webcamStream;

    // Set up canvas size when video is ready
    const handleVideoReady = () => {
      console.log('[PoseDetection] Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
      const canvas = canvasRef.current;
      if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('[PoseDetection] Canvas setup from metadata:', canvas.width, 'x', canvas.height);
      } else {
        console.warn('[PoseDetection] Video dimensions not ready:', video.videoWidth, video.videoHeight);
      }
    };

    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('loadeddata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);

    let frameCount = 0;
    const processFrame = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Ensure canvas matches video size
        const canvas = canvasRef.current;
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log('[PoseDetection] Canvas resized during processing:', canvas.width, 'x', canvas.height);
        }

        // Only process pose if initialized
        if (isInitialized && poseRef.current) {
          try {
            await poseRef.current.send({ image: video });

            // Log every 60 frames (about once per second at 60fps)
            if (frameCount % 60 === 0) {
              console.log('[PoseDetection] Processed frame', frameCount);
            }
          } catch (error) {
            console.error('[PoseDetection] Error processing frame:', error);
          }
        } else {
          // If pose detection not ready, just draw the video to canvas
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
        frameCount++;
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    video.play().then(() => {
      console.log('[PoseDetection] Video playing, starting frame processing');
      processFrame();
    }).catch(err => {
      console.error('[PoseDetection] Error playing video:', err);
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (video) {
        video.removeEventListener('loadedmetadata', handleVideoReady);
        video.removeEventListener('loadeddata', handleVideoReady);
        video.removeEventListener('canplay', handleVideoReady);
        video.pause();
        video.srcObject = null;
      }
      console.log('[PoseDetection] Cleanup complete');
    };
  }, [isInitialized, webcamStream, isActive]);

  return {
    canvasRef,
    videoRef,
    poseResults,
    isInitialized,
    comparisonScore
  };
};

