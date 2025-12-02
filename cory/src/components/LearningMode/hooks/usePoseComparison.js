import { useState, useEffect, useRef } from 'react';
import { 
  calculatePoseSimilarity, 
  compareJointAngles, 
  calculateJointAngles,
  getFeedbackMessage 
} from '../utils/poseComparison';

/**
 * Hook for comparing live pose with reference pose in real-time
 * @param {Object} livePose - Current pose from webcam
 * @param {Object} referencePose - Reference pose from uploaded video
 * @param {Object} options - Comparison options
 * @returns {Object} - Comparison results and statistics
 */
export const usePoseComparison = (livePose, referencePose, options = {}) => {
  const [comparisonResult, setComparisonResult] = useState(null);
  const [angleComparison, setAngleComparison] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [statistics, setStatistics] = useState({
    avgScore: 0,
    maxScore: 0,
    minScore: 100,
    frameCount: 0,
    scoreHistory: []
  });
  
  const statsRef = useRef(statistics);
  const historyLimitRef = useRef(options.historyLimit || 100);

  // Update statistics when comparison happens
  useEffect(() => {
    if (!livePose || !referencePose) {
      setComparisonResult(null);
      setAngleComparison(null);
      setFeedback(null);
      return;
    }

    // Get keypoints from poses
    const liveKeypoints = livePose.keypoints;
    const refKeypoints = referencePose.keypoints;

    if (!liveKeypoints || !refKeypoints) return;

    // Calculate pose similarity
    const similarity = calculatePoseSimilarity(
      liveKeypoints,
      refKeypoints,
      options.keypointWeights
    );

    // Calculate joint angles
    const liveAngles = calculateJointAngles(liveKeypoints);
    const refAngles = calculateJointAngles(refKeypoints);
    const angleComp = compareJointAngles(liveAngles, refAngles);

    // Combined score (weighted average of similarity and angle comparison)
    const poseSimilarityWeight = options.poseSimilarityWeight || 0.6;
    const angleWeight = options.angleWeight || 0.4;
    const combinedScore = (
      similarity.score * poseSimilarityWeight +
      angleComp.score * angleWeight
    );

    // Get feedback message
    const feedbackMsg = getFeedbackMessage(combinedScore);

    // Update statistics
    const newStats = { ...statsRef.current };
    newStats.frameCount += 1;
    newStats.scoreHistory.push(combinedScore);
    
    // Keep history limited
    if (newStats.scoreHistory.length > historyLimitRef.current) {
      newStats.scoreHistory.shift();
    }
    
    // Calculate average from history
    newStats.avgScore = newStats.scoreHistory.reduce((a, b) => a + b, 0) / newStats.scoreHistory.length;
    newStats.maxScore = Math.max(newStats.maxScore, combinedScore);
    newStats.minScore = Math.min(newStats.minScore, combinedScore);
    
    statsRef.current = newStats;
    setStatistics(newStats);

    // Set results
    setComparisonResult({
      ...similarity,
      combinedScore: Math.round(combinedScore * 10) / 10,
      liveAngles,
      refAngles
    });
    setAngleComparison(angleComp);
    setFeedback(feedbackMsg);

  }, [livePose, referencePose, options.keypointWeights, options.poseSimilarityWeight, options.angleWeight]);

  // Reset statistics
  const resetStatistics = () => {
    const initialStats = {
      avgScore: 0,
      maxScore: 0,
      minScore: 100,
      frameCount: 0,
      scoreHistory: []
    };
    statsRef.current = initialStats;
    setStatistics(initialStats);
  };

  return {
    comparisonResult,
    angleComparison,
    feedback,
    statistics,
    resetStatistics
  };
};




