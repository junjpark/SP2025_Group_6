"""
Pose estimation processing using MediaPipe.
"""
import os
import logging
from typing import List, Dict, Optional
import cv2
import mediapipe as mp
import subprocess
# pylint: disable=no-member

logger = logging.getLogger(__name__)



def process_frame_for_landmarks(frame, frame_idx, cap, pose):
    """
    Helper to process a single frame and extract pose landmarks.
    """
    # had to separate this out because of too many local variables in process_video_for_landmarks
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = pose.process(rgb_frame)
    timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
    entry: Dict[str, Optional[object]] = {
        "frame": frame_idx,
        "time": timestamp_ms / 1000.0,
        "landmarks": None
    }
    if res.pose_landmarks:
        entry["landmarks"] = [
            {
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": getattr(lm, 'visibility', None)
            }
            for lm in res.pose_landmarks.landmark
        ]
    return entry


def process_video_for_landmarks(video_path: str, video_sample_rate: int = 1) -> str:
    """
    Process a video file and extract pose landmarks per frame using MediaPipe.

    Args:
        video_path: Path to the input video file.
        video_sample_rate: Process every `video_sample_rate` frames (1 = every frame).

    Returns:
        A list of landmark entries : [{"frame": int, "time": seconds, "landmarks":
          [{x,y,z,visibility}, ...]}, ... ]
    """
    # Do not remove an existing processing marker here;
    # the API creates it to signal processing start.
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
        mp_pose = mp.solutions.pose

        with mp_pose.Pose(static_image_mode=False,
                          model_complexity=1,
                          enable_segmentation=False) as pose:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % video_sample_rate != 0:
                    frame_idx += 1
                    continue
                results_list.append(process_frame_for_landmarks(frame, frame_idx, cap, pose))
                frame_idx += 1

        cap.release()
        logger.info("Frame processing finished for %s, frames=%d", video_path, frame_idx)
        return results_list
    except Exception as exc:
        logger.exception("Error processing video for landmarks: %s", video_path)
        raise RuntimeError(f"Failed to process video for landmarks: {video_path}") from exc
    finally:
        cap.release()


# New: Render an annotated video with pose landmarks overlaid
def render_landmarks_video(input_video_path: str, output_video_path: Optional[str] = None) -> str:
    """
    Render pose landmarks onto a copy of the input video and return the output path.

    Args:
        input_video_path: Path to the input video file.
        output_video_path: Optional explicit path for the annotated output.

    Returns:
        The path to the annotated output video (MP4).
    """
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Video not found: {input_video_path}")

    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video: {input_video_path}")

    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if not output_video_path:
            base, _ = os.path.splitext(input_video_path)
            output_video_path = f"{base}_landmarks.mp4"

        out_dir = os.path.dirname(output_video_path) or "."
        os.makedirs(out_dir, exist_ok=True)

        # Write an intermediate file first using OpenCV (mp4v), then transcode to H.264 for browser playback
        intermediate_path = (output_video_path + ".tmp.mp4") if output_video_path else None
        if intermediate_path is None:
            base, _ = os.path.splitext(input_video_path)
            intermediate_path = f"{base}_landmarks.tmp.mp4"

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(intermediate_path, fourcc, fps, (width, height))
        if not writer.isOpened():
            raise RuntimeError("Failed to open VideoWriter for output.")

        mp_pose = mp.solutions.pose
        drawing_utils = mp.solutions.drawing_utils
        drawing_styles = mp.solutions.drawing_styles

        with mp_pose.Pose(static_image_mode=False, model_complexity=1, enable_segmentation=False) as pose:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = pose.process(rgb)

                if res.pose_landmarks:
                    drawing_utils.draw_landmarks(
                        frame,
                        res.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=drawing_styles.get_default_pose_landmarks_style(),
                    )

                writer.write(frame)

        writer.release()

        # Transcode to H.264/AVC for broad browser compatibility
        # - yuv420p pixel format
        # - +faststart to move moov atom to beginning for progressive playback
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i",
            intermediate_path,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            output_video_path,
        ]
        try:
            subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as exc:
            logger.exception("ffmpeg transcode failed: %s", exc.stderr.decode(errors='ignore') if exc.stderr else exc)
            raise RuntimeError("Failed to transcode annotated video to H.264") from exc
        finally:
            try:
                if os.path.exists(intermediate_path):
                    os.remove(intermediate_path)
            except Exception:
                pass

        return output_video_path
    except Exception as exc:
        logger.exception("Error rendering landmarks on video: %s", input_video_path)
        raise RuntimeError(f"Failed to render landmarks on video: {input_video_path}") from exc
    finally:
        cap.release()

if __name__ == '__main__':
    import sys
    if len(sys.argv) >= 3:
        in_vid = sys.argv[1]
        sample_rate = int(sys.argv[2]) if len(sys.argv) >= 4 else 1
        print('Processing', in_vid)
        try:
            process_video_for_landmarks(in_vid, video_sample_rate=sample_rate)
            print('Done')
        except (RuntimeError, FileNotFoundError) as e:
            print('Error:', e)
    else:
        print('Usage: pose_estimation.py <video_path> <output_json> [sample_rate]')
