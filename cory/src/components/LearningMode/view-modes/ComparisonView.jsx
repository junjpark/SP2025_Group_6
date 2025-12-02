import React, { useRef } from 'react';
import CustomVideoPlayer from '../../CustomVideoPlayer';
import WebcamCanvas from '../WebcamCanvas';
import PoseScoreDisplay from '../PoseScoreDisplay';
import { usePoseComparison } from '../hooks/usePoseComparison';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import { useReferencePoseLandmarks } from '../hooks/useReferencePoseLandmarks';

/**
 * Comparison View - Shows webcam and reference video side-by-side
 * with real-time pose comparison and color-coded skeleton
 */
const ComparisonView = ({
  videoPlayerRef,
  webcamStream,
  videoUrl,
  projectId,
  startTime,
  endTime
}) => {
  const refVideoRef = useRef(null);

  // Get pose from webcam
  const { poseResults: livePose } = useMediaPipePose(webcamStream, true);
  
  // Get pre-computed pose from reference video (fetched from backend, NOT reprocessed!)
  const { currentPose: referencePose } = useReferencePoseLandmarks(
    projectId,
    refVideoRef.current,
    true
  );

  // Compare poses and get scoring
  const { comparisonResult, feedback, statistics } = usePoseComparison(
    livePose?.[0],
    referencePose
  );

  return (
    <div className="comparison-view">
      <div className="comparison-container">
        {/* Live Webcam with Color-Coded Skeleton */}
        <div className="comparison-webcam">
          <div className="view-label">Your Performance</div>
          <WebcamCanvas
            webcamStream={webcamStream}
            isActive={true}
            referencePose={referencePose}
            className="webcam-video"
          />
        </div>

        {/* Reference Video with Pose Overlay */}
        <div className="comparison-reference">
          <div className="view-label">Reference</div>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              ref={refVideoRef}
              src={videoUrl}
              controls
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000'
              }}
            />
            {/* Landmarks are pre-computed on backend, no need for canvas overlay here */}
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="comparison-score">
        <PoseScoreDisplay
          comparisonResult={comparisonResult}
          feedback={feedback}
          statistics={statistics}
          showDetails={true}
        />
      </div>

      {/* Legend */}
      <div className="comparison-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#FF0000' }}></div>
          <span>Not Matching</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#FFAA00' }}></div>
          <span>Partially Matching</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#00FF00' }}></div>
          <span>Perfect Match!</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;




