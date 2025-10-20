import cv2
import mediapipe as mp
import os
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def process_video_for_landmarks(video_path: str, sample_rate: int = 1) -> str:
    """
    Process a video file and extract pose landmarks per frame using MediaPipe.

    Args:
        video_path: Path to the input video file.
        sample_rate: Process every `sample_rate` frames (1 = every frame).

    Returns:
        A list of landmark entries : [{"frame": int, "time": seconds, "landmarks": [{x,y,z,visibility}, ...]}, ... ]

    """
    
    # Do not remove an existing processing marker here; the API creates it to signal processing start.
    # This avoids races where the processor deletes the marker created by the API before the API
    # had a chance to notify clients.

    try:
        
        logger.info("Opening video for processing: %s", video_path)
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video: {video_path}")

        logger.info("Video opened, starting frame processing for %s", video_path)

        results_list: List[Dict] = []
        frame_idx = 0

        # Use the MediaPipe Pose solution; this is the CPU-friendly API available across platforms
        mp_pose = mp.solutions.pose

        with mp_pose.Pose(static_image_mode=False, model_complexity=1, enable_segmentation=False) as pose:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % sample_rate != 0:
                    frame_idx += 1
                    continue

                # Convert BGR (OpenCV) to RGB (MediaPipe)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = pose.process(rgb_frame)

                timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
                entry: Dict[str, Optional[object]] = {"frame": frame_idx, "time": timestamp_ms / 1000.0, "landmarks": None}

                if res.pose_landmarks:
                    lm_list = []
                    for lm in res.pose_landmarks.landmark:
                        lm_list.append({
                            "x": lm.x,
                            "y": lm.y,
                            "z": lm.z,
                            "visibility": getattr(lm, 'visibility', None)
                        })
                    entry["landmarks"] = lm_list

                results_list.append(entry)
                frame_idx += 1

        cap.release()
        logger.info("Frame processing finished for %s, frames=%d", video_path, frame_idx)

        return results_list

    except Exception:
        logger.exception("Error processing video for landmarks: %s", video_path)
        raise RuntimeError(f"Failed to process video for landmarks: {video_path}")
    finally:
        cap.release()


if __name__ == '__main__':
    import sys
    if len(sys.argv) >= 3:
        in_vid = sys.argv[1]
        out_json = sys.argv[2]
        sample_rate = int(sys.argv[3]) if len(sys.argv) >= 4 else 1
        print('Processing', in_vid, '->', out_json)
        try:
            process_video_for_landmarks(in_vid, out_json, sample_rate=sample_rate)
            print('Done')
        except Exception as e:
            print('Error:', e)
    else:
        print('Usage: pose_estimation.py <video_path> <output_json> [sample_rate]')