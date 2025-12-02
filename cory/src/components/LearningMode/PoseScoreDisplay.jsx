import React from 'react';
import './PoseScoreDisplay.css';

/**
 * Component to display real-time pose comparison score
 * Shows score, feedback, and detailed metrics
 */
const PoseScoreDisplay = ({ 
  comparisonResult, 
  feedback, 
  statistics,
  showDetails = true 
}) => {
  if (!comparisonResult) {
    return (
      <div className="pose-score-display waiting">
        <p>Waiting for pose detection...</p>
      </div>
    );
  }

  const score = comparisonResult.combinedScore || 0;
  const scorePercentage = Math.min(100, Math.max(0, score));

  // Calculate color based on score
  const getScoreColor = (score) => {
    if (score >= 85) return '#00FF00';
    if (score >= 75) return '#7FFF00';
    if (score >= 65) return '#FFFF00';
    if (score >= 50) return '#FFA500';
    return '#FF6347';
  };

  const scoreColor = getScoreColor(score);

  return (
    <div className="pose-score-display">
      {/* Main Score Circle */}
      <div className="score-circle" style={{ borderColor: scoreColor }}>
        <div className="score-value" style={{ color: scoreColor }}>
          {score.toFixed(1)}
        </div>
        <div className="score-label">Score</div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className="feedback-message" style={{ color: feedback.color }}>
          {feedback.message}
        </div>
      )}

      {/* Progress Bar */}
      <div className="score-bar-container">
        <div 
          className="score-bar-fill" 
          style={{ 
            width: `${scorePercentage}%`,
            backgroundColor: scoreColor
          }}
        />
      </div>

      {/* Detailed Statistics */}
      {showDetails && statistics && (
        <div className="score-details">
          <div className="stat-item">
            <span className="stat-label">Average:</span>
            <span className="stat-value">{statistics.avgScore.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Best:</span>
            <span className="stat-value">{statistics.maxScore.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Frames:</span>
            <span className="stat-value">{statistics.frameCount}</span>
          </div>
        </div>
      )}

      {/* Joint Angles Info (if available) */}
      {showDetails && comparisonResult.liveAngles && (
        <div className="joint-angles">
          <div className="angles-title">Joint Angles</div>
          <div className="angles-grid">
            {Object.entries(comparisonResult.liveAngles).map(([joint, angle]) => (
              <div key={joint} className="angle-item">
                <span className="angle-joint">{joint.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="angle-value">{angle.toFixed(0)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worst Matching Keypoints */}
      {showDetails && comparisonResult.details?.keypointScores && (
        <div className="keypoint-feedback">
          <div className="feedback-title">Areas to Improve:</div>
          <ul className="keypoint-list">
            {comparisonResult.details.keypointScores.slice(0, 3).map((kp, idx) => (
              <li key={idx} className="keypoint-item">
                <span className="keypoint-name">{kp.name.replace(/_/g, ' ')}</span>
                <span className="keypoint-score">{kp.score.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PoseScoreDisplay;



