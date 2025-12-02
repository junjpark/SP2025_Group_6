import { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

/**
 * Custom hook for pose detection on uploaded video
 * @param {HTMLVideoElement} videoElement - The video element to analyze
 * @param {boolean} isActive - Whether pose detection should be active
 * @returns {Object} - Contains current pose and drawing canvas ref
 */
export const useVideoPose = (videoElement, isActive) => {
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPose, setCurrentPose] = useState(null);

  // Initialize TensorFlow.js Pose Detection (shared detector)
  useEffect(() => {
    if (!isActive) return;

    const initializePose = async () => {
      try {
        // Wait for TensorFlow backend to be ready
        await tf.setBackend('webgl');
        await tf.ready();
        
        // Use BlazePose for detailed pose detection
        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'full',
          enableSmoothing: true,
          enableSegmentation: false
        };
        
        const detector = await poseDetection.createDetector(model, detectorConfig);
        detectorRef.current = detector;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Video Pose Detection:', error);
      }
    };

    initializePose();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsInitialized(false);
    };
  }, [isActive]);

  // Define pose connections for drawing skeleton (BlazePose 33 keypoints)
  const POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    // Torso
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    // Arms
    [11, 23], [12, 24], [23, 24],
    // Legs
    [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
    [24, 26], [26, 28], [28, 30], [30, 32], [28, 32]
  ];

  // Draw pose results on canvas overlay
  const drawPoseResults = (video, poses) => {
    if (!canvasRef.current || !video) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Clear canvas (transparent background, video shows through)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pose landmarks
    if (poses && poses.length > 0) {
      const pose = poses[0];

      // Draw connections
      POSE_CONNECTIONS.forEach(([i, j]) => {
        const kp1 = pose.keypoints[i];
        const kp2 = pose.keypoints[j];
        
        if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
          const avgConfidence = (kp1.score + kp2.score) / 2;
          const alpha = Math.min(1, avgConfidence);
          
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`; // Cyan for reference video
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      });

      // Draw keypoints
      pose.keypoints.forEach(keypoint => {
        if (keypoint && keypoint.score > 0.5) {
          const radius = 3 + (keypoint.score * 3);
          const alpha = Math.min(1, keypoint.score);
          
          ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`; // Yellow for reference video
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }
  };

  // Process video frames
  useEffect(() => {
    if (!isInitialized || !videoElement || !isActive) return;

    const processFrame = async () => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && detectorRef.current) {
        try {
          const poses = await detectorRef.current.estimatePoses(videoElement);
          if (poses && poses.length > 0) {
            setCurrentPose(poses[0]);
          } else {
            setCurrentPose(null);
          }
          drawPoseResults(videoElement, poses);
        } catch (error) {
          console.error('Error processing video frame:', error);
        }
      }

      if (!videoElement.paused && !videoElement.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    // Listen for video play event
    const handlePlay = () => {
      processFrame();
    };

    // Listen for video pause/end
    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handlePause);

    // Start processing if video is already playing
    if (!videoElement.paused) {
      processFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handlePause);
    };
  }, [isInitialized, videoElement, isActive]);

  return {
    canvasRef,
    currentPose,
    isInitialized
  };
};






