import { useState, useEffect, useRef } from 'react';

/**
 * Hook to fetch and sync pre-computed pose landmarks from backend
 * @param {number} projectId - The project ID to fetch landmarks for
 * @param {HTMLVideoElement} videoElement - The video element to sync with
 * @param {boolean} isActive - Whether to actively sync landmarks
 * @returns {Object} Current frame's pose landmarks synced with video playback
 */
export const useReferencePoseLandmarks = (projectId, videoElement, isActive) => {
  const [allLandmarks, setAllLandmarks] = useState(null);
  const [currentPose, setCurrentPose] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const syncIntervalRef = useRef(null);

  // Fetch landmarks from backend
  useEffect(() => {
    console.log('[ReferenceLandmarks] Hook called with:', { projectId, isActive });
    
    if (!projectId) {
      console.warn('[ReferenceLandmarks] No projectId provided!');
      return;
    }
    
    if (!isActive) {
      console.log('[ReferenceLandmarks] Not active, skipping fetch');
      return;
    }

    const fetchLandmarks = async () => {
      try {
        setLoading(true);
        console.log('[ReferenceLandmarks] Fetching landmarks for project:', projectId);
        
        // Enable parallel processing for ~10x faster landmark processing
        const url = `/api/projects/${projectId}/landmarks?sample_rate=1&use_parallel=true&num_workers=12`;
        console.log('[ReferenceLandmarks] API URL:', url);
        
        const response = await fetch(url, {
          credentials: 'include'
        });

        console.log('[ReferenceLandmarks] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[ReferenceLandmarks] ✓ Loaded', data.length, 'frames of landmarks');
          setAllLandmarks(data);
          setError(null);
        } else {
          const errorText = await response.text();
          console.error('[ReferenceLandmarks] Failed to fetch:', response.status, errorText);
          setError(`Failed to load landmarks: ${response.status}`);
        }
      } catch (err) {
        console.error('[ReferenceLandmarks] Error fetching landmarks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLandmarks();
  }, [projectId, isActive]);

  // Sync landmarks with video playback
  useEffect(() => {
    if (!allLandmarks) {
      console.log('[ReferenceLandmarks] No landmarks data yet');
      return;
    }
    
    if (!videoElement) {
      console.log('[ReferenceLandmarks] No video element yet');
      return;
    }
    
    if (!isActive) {
      console.log('[ReferenceLandmarks] Not active');
      return;
    }
    
    console.log('[ReferenceLandmarks] Starting sync with', allLandmarks.length, 'frames');

    const syncPose = () => {
      const currentTime = videoElement.currentTime;
      
      // Find the closest frame by time
      let closestFrame = null;
      let minTimeDiff = Infinity;
      
      for (const frameData of allLandmarks) {
        const timeDiff = Math.abs(frameData.time - currentTime);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestFrame = frameData;
        }
      }
      
      if (closestFrame && closestFrame.landmarks) {
        // Convert to MediaPipe format
        const poseLandmarks = closestFrame.landmarks.map(lm => ({
          x: lm.x,
          y: lm.y,
          z: lm.z || 0,
          visibility: lm.visibility || 1
        }));
        
        setCurrentPose({
          poseLandmarks: poseLandmarks,
          frame: closestFrame.frame,
          time: closestFrame.time
        });
      }
    };

    // Use requestAnimationFrame for smoother, faster updates
    let animationFrameId;
    
    const continuousSync = () => {
      syncPose();
      animationFrameId = requestAnimationFrame(continuousSync);
    };
    
    // Start syncing
    continuousSync();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [allLandmarks, videoElement, isActive]);

  // Log when pose updates
  useEffect(() => {
    if (currentPose) {
      console.log('[ReferenceLandmarks] ✓ Current pose updated - frame', currentPose.frame, 'at', currentPose.time.toFixed(2), 's with', currentPose.poseLandmarks?.length, 'landmarks');
    } else {
      console.log('[ReferenceLandmarks] Current pose is null');
    }
  }, [currentPose]);

  return {
    currentPose,
    allLandmarks,
    loading,
    error,
    isReady: !loading && !error && allLandmarks && allLandmarks.length > 0
  };
};

