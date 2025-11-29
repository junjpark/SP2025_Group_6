/**
 * Utility functions for comparing and scoring poses
 * Used to compare live webcam pose with reference video pose
 */

/**
 * Calculate the Euclidean distance between two 2D points
 */
const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Normalize keypoint coordinates relative to body size
 * Uses hip distance as normalization factor
 */
const normalizeKeypoints = (keypoints) => {
  // Use hip width (keypoint 23-24) for normalization
  const leftHip = keypoints[23];
  const rightHip = keypoints[24];
  
  if (!leftHip || !rightHip || leftHip.score < 0.3 || rightHip.score < 0.3) {
    return null; // Cannot normalize if hips not detected
  }
  
  const hipDistance = calculateDistance(leftHip, rightHip);
  if (hipDistance === 0) return null;
  
  // Normalize all keypoints
  return keypoints.map(kp => ({
    ...kp,
    x: kp.x / hipDistance,
    y: kp.y / hipDistance
  }));
};

/**
 * Calculate angle between three points (in degrees)
 * Useful for comparing joint angles
 */
export const calculateAngle = (point1, point2, point3) => {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
};

/**
 * Calculate similarity score between two poses (0-100)
 * Higher score means more similar poses
 * 
 * @param {Array} livePoseKeypoints - Keypoints from live webcam feed
 * @param {Array} referencePoseKeypoints - Keypoints from reference video
 * @param {Array} keypointWeights - Optional weights for each keypoint (default: all equal)
 * @returns {Object} { score: number, details: Object }
 */
export const calculatePoseSimilarity = (
  livePoseKeypoints, 
  referencePoseKeypoints,
  keypointWeights = null
) => {
  if (!livePoseKeypoints || !referencePoseKeypoints) {
    return { score: 0, details: { error: 'Missing pose data' } };
  }
  
  // Normalize both poses
  const normalizedLive = normalizeKeypoints(livePoseKeypoints);
  const normalizedRef = normalizeKeypoints(referencePoseKeypoints);
  
  if (!normalizedLive || !normalizedRef) {
    return { score: 0, details: { error: 'Cannot normalize poses' } };
  }
  
  // Default weights (higher weight for key body parts)
  const weights = keypointWeights || [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // Face and head (0-10)
    2, 2,                             // Shoulders (11-12) - important
    2, 2,                             // Elbows (13-14) - important
    2, 2,                             // Wrists (15-16) - important
    1, 1, 1, 1, 1, 1,                 // Hands (17-22)
    2, 2,                             // Hips (23-24) - important
    2, 2,                             // Knees (25-26) - important
    2, 2,                             // Ankles (27-28) - important
    1, 1, 1, 1                        // Feet (29-32)
  ];
  
  let totalError = 0;
  let totalWeight = 0;
  let validKeypoints = 0;
  const keypointScores = [];
  
  // Compare each keypoint
  for (let i = 0; i < Math.min(normalizedLive.length, normalizedRef.length); i++) {
    const liveKp = normalizedLive[i];
    const refKp = normalizedRef[i];
    
    // Only compare keypoints with sufficient confidence
    if (liveKp.score > 0.3 && refKp.score > 0.3) {
      const distance = calculateDistance(liveKp, refKp);
      const error = distance * weights[i];
      
      totalError += error;
      totalWeight += weights[i];
      validKeypoints++;
      
      keypointScores.push({
        index: i,
        name: getKeypointName(i),
        distance: distance,
        score: Math.max(0, 100 - distance * 100)
      });
    }
  }
  
  if (validKeypoints === 0) {
    return { score: 0, details: { error: 'No valid keypoints detected' } };
  }
  
  // Calculate final score (0-100, where 100 is perfect match)
  const avgError = totalError / totalWeight;
  const similarityScore = Math.max(0, Math.min(100, 100 - (avgError * 100)));
  
  return {
    score: Math.round(similarityScore * 10) / 10, // Round to 1 decimal
    details: {
      validKeypoints,
      totalKeypoints: livePoseKeypoints.length,
      avgError: avgError.toFixed(4),
      keypointScores: keypointScores.sort((a, b) => a.score - b.score).slice(0, 5) // Show 5 worst matches
    }
  };
};

/**
 * Calculate key joint angles for pose analysis
 */
export const calculateJointAngles = (keypoints) => {
  if (!keypoints || keypoints.length < 33) return null;
  
  const angles = {};
  
  // Left elbow angle
  if (keypoints[11].score > 0.3 && keypoints[13].score > 0.3 && keypoints[15].score > 0.3) {
    angles.leftElbow = calculateAngle(keypoints[11], keypoints[13], keypoints[15]);
  }
  
  // Right elbow angle
  if (keypoints[12].score > 0.3 && keypoints[14].score > 0.3 && keypoints[16].score > 0.3) {
    angles.rightElbow = calculateAngle(keypoints[12], keypoints[14], keypoints[16]);
  }
  
  // Left knee angle
  if (keypoints[23].score > 0.3 && keypoints[25].score > 0.3 && keypoints[27].score > 0.3) {
    angles.leftKnee = calculateAngle(keypoints[23], keypoints[25], keypoints[27]);
  }
  
  // Right knee angle
  if (keypoints[24].score > 0.3 && keypoints[26].score > 0.3 && keypoints[28].score > 0.3) {
    angles.rightKnee = calculateAngle(keypoints[24], keypoints[26], keypoints[28]);
  }
  
  // Left shoulder angle
  if (keypoints[13].score > 0.3 && keypoints[11].score > 0.3 && keypoints[23].score > 0.3) {
    angles.leftShoulder = calculateAngle(keypoints[13], keypoints[11], keypoints[23]);
  }
  
  // Right shoulder angle
  if (keypoints[14].score > 0.3 && keypoints[12].score > 0.3 && keypoints[24].score > 0.3) {
    angles.rightShoulder = calculateAngle(keypoints[14], keypoints[12], keypoints[24]);
  }
  
  // Left hip angle
  if (keypoints[11].score > 0.3 && keypoints[23].score > 0.3 && keypoints[25].score > 0.3) {
    angles.leftHip = calculateAngle(keypoints[11], keypoints[23], keypoints[25]);
  }
  
  // Right hip angle
  if (keypoints[12].score > 0.3 && keypoints[24].score > 0.3 && keypoints[26].score > 0.3) {
    angles.rightHip = calculateAngle(keypoints[12], keypoints[24], keypoints[26]);
  }
  
  return angles;
};

/**
 * Compare joint angles between two poses
 */
export const compareJointAngles = (liveAngles, referenceAngles) => {
  if (!liveAngles || !referenceAngles) {
    return { score: 0, details: {} };
  }
  
  const angleDiffs = {};
  let totalDiff = 0;
  let count = 0;
  
  for (const joint in referenceAngles) {
    if (liveAngles[joint] !== undefined) {
      const diff = Math.abs(liveAngles[joint] - referenceAngles[joint]);
      angleDiffs[joint] = diff;
      totalDiff += diff;
      count++;
    }
  }
  
  if (count === 0) {
    return { score: 0, details: {} };
  }
  
  const avgDiff = totalDiff / count;
  const score = Math.max(0, 100 - (avgDiff / 1.8)); // 180 degrees = 0 score
  
  return {
    score: Math.round(score * 10) / 10,
    details: {
      averageAngleDifference: Math.round(avgDiff * 10) / 10,
      jointDifferences: angleDiffs
    }
  };
};

/**
 * Get human-readable name for keypoint index (BlazePose 33 keypoints)
 */
export const getKeypointName = (index) => {
  const names = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
  ];
  return names[index] || `keypoint_${index}`;
};

/**
 * Get feedback message based on similarity score
 */
export const getFeedbackMessage = (score) => {
  if (score >= 95) return { message: 'Perfect! 🌟', color: '#00FF00' };
  if (score >= 85) return { message: 'Excellent! 🎉', color: '#7FFF00' };
  if (score >= 75) return { message: 'Great! 👍', color: '#FFFF00' };
  if (score >= 65) return { message: 'Good! 👌', color: '#FFA500' };
  if (score >= 50) return { message: 'Keep trying! 💪', color: '#FF6347' };
  return { message: 'Need more practice 📚', color: '#FF0000' };
};

