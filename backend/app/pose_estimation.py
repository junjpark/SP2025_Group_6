"""
Pose estimation processing using MediaPipe with parallel processing support.
"""
import os
import logging
import subprocess
from typing import List, Dict, Optional
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing as mp_sys
import cv2
import mediapipe as mp
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


def _process_frame_batch(
    video_path: str,
    frame_indices: List[int],
    video_sample_rate: int = 1,
    model_complexity: int = 1
) -> List[Dict]:
    """
    Process a batch of frames in a separate process.
    Used for parallel processing of frame chunks.
    
    Args:
        video_path: Path to the video file
        frame_indices: List of frame indices to process
        video_sample_rate: Sample rate for frames
        model_complexity: MediaPipe model complexity (0=lite, 1=full, 2=heavy)
    
    Returns:
        List of landmark entries for the processed frames
    """
    results = []
    cap = cv2.VideoCapture(video_path)

    try:
        mp_pose = mp.solutions.pose
        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as pose:
            for frame_idx in frame_indices:
                if frame_idx % video_sample_rate != 0:
                    continue

                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()

                if not ret:
                    continue

                # Process frame
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = pose.process(rgb_frame)

                # Get timestamp
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

                results.append(entry)
    finally:
        cap.release()

    return results


def _process_video_chunk_sequential(
    video_path: str,
    frame_indices: List[int],
    video_sample_rate: int = 1,
    model_complexity: int = 1
) -> List[Dict]:
    """
    Process a contiguous chunk of video frames sequentially.
    This is more efficient than seeking for each frame as it processes
    video sequentially without constant seeking.
    
    Args:
        video_path: Path to the video file
        frame_indices: List of frame indices to process (should be contiguous)
        video_sample_rate: Sample rate for frames
        model_complexity: MediaPipe model complexity (0=lite, 1=full, 2=heavy)
    
    Returns:
        List of landmark entries for the processed frames
    """
    results = []
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        logger.error("Failed to open video: %s", video_path)
        return results

    try:
        if not frame_indices:
            return results

        # Get the range of frames to process
        start_frame = frame_indices[0]
        end_frame = frame_indices[-1]
        frame_indices_set = set(frame_indices)

        # Seek to start position
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        mp_pose = mp.solutions.pose
        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as pose:
            current_frame = start_frame
            
            # Read frames sequentially from start to end
            while current_frame <= end_frame:
                ret, frame = cap.read()
                
                if not ret:
                    break

                # Only process frames that are in our list and match sample rate
                if current_frame in frame_indices_set and current_frame % video_sample_rate == 0:
                    # Process frame
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    res = pose.process(rgb_frame)

                    # Get timestamp
                    timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))

                    entry: Dict[str, Optional[object]] = {
                        "frame": current_frame,
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

                    results.append(entry)
                
                current_frame += 1

    except Exception as exc:
        logger.exception("Error processing video chunk: %s", exc)
    finally:
        cap.release()

    return results


def process_video_for_landmarks(
    video_path: str,
    video_sample_rate: int = 1,
    use_parallel: bool = False,
    num_workers: Optional[int] = None,
    model_complexity: int = 1
) -> List[Dict]:
    """
    Process a video file and extract pose landmarks per frame using MediaPipe.

    Args:
        video_path: Path to the input video file.
        video_sample_rate: Process every `video_sample_rate` frames (1 = every frame).
        use_parallel: If True, use parallel processing for frames (faster for long videos).
        num_workers: Number of parallel workers (defaults to CPU count - 1).
        model_complexity: MediaPipe model complexity (0=lite, 1=full, 2=heavy).

    Returns:
        A list of landmark entries : [{"frame": int, "time": seconds, "landmarks":
          [{x,y,z,visibility}, ...]}, ... ]
    """
    # Do not remove an existing processing marker here;
    # the API creates it to signal processing start.
    # This avoids races where the processor deletes the marker created by the API before the API
    # had a chance to notify clients.

    try:
        logger.info("Opening video for processing: %s (parallel=%s)", video_path, use_parallel)
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        if use_parallel:
            return _process_video_parallel(
                video_path,
                video_sample_rate,
                num_workers,
                model_complexity
            )

        # Original sequential processing
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video: {video_path}")

        logger.info("Video opened, starting frame processing for %s", video_path)

        results_list: List[Dict] = []
        frame_idx = 0
        mp_pose = mp.solutions.pose

        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as pose:
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
        if 'cap' in locals():
            cap.release()


def _process_video_parallel(
    video_path: str,
    video_sample_rate: int = 1,
    num_workers: Optional[int] = None,
    model_complexity: int = 1
) -> List[Dict]:
    """
    Process video frames in parallel using multiprocessing.
    Splits the video into approximately 12 equal-length batches and processes each in parallel.

    Args:
        video_path: Path to the video file
        video_sample_rate: Sample rate for frames
        num_workers: Number of parallel workers (defaults to 12)
        model_complexity: MediaPipe model complexity

    Returns:
        List of landmark entries sorted by frame index
    """
    # Get video info
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    # Default to 12 workers for optimal video chunk processing
    if num_workers is None:
        num_workers = 12
    
    # Ensure we don't create more workers than needed
    num_workers = min(num_workers, max(1, mp_sys.cpu_count() - 1))
    
    # Also ensure we don't have more workers than frames to process
    frames_to_process = (total_frames + video_sample_rate - 1) // video_sample_rate
    num_workers = min(num_workers, max(1, frames_to_process))

    # Split video into equal-length chunks (contiguous frame ranges)
    frames_per_chunk = max(1, total_frames // num_workers)
    
    # Create contiguous frame ranges for each chunk - one chunk per worker
    frame_chunks = []
    for i in range(num_workers):
        start_frame = i * frames_per_chunk
        # Last chunk gets any remaining frames
        end_frame = total_frames if i == num_workers - 1 else (i + 1) * frames_per_chunk
        
        if start_frame < total_frames:
            # Include all frames in range (sample rate filtering happens in processing)
            chunk_frames = list(range(start_frame, end_frame))
            frame_chunks.append(chunk_frames)

    logger.info(
        "Processing video in %d chunks (%.1f seconds per chunk) with %d workers",
        len(frame_chunks), frames_per_chunk / fps if fps > 0 else 0, len(frame_chunks)
    )
    logger.info("Total frames: %d, Frames to process (before sampling): %d", 
                total_frames, sum(len(chunk) for chunk in frame_chunks))

    # Process chunks in parallel
    all_results = []
    with ProcessPoolExecutor(max_workers=len(frame_chunks)) as executor:
        futures = [
            executor.submit(
                _process_video_chunk_sequential,
                video_path,
                chunk,
                video_sample_rate,
                model_complexity
            )
            for chunk in frame_chunks
        ]

        # Collect results as they complete
        completed = 0
        for future in as_completed(futures):
            try:
                chunk_results = future.result()
                all_results.extend(chunk_results)
                completed += 1
                logger.info("Chunk %d/%d completed, %d frames processed", 
                           completed, len(frame_chunks), len(chunk_results))
            except Exception as exc:
                logger.exception("Error processing frame chunk: %s", exc)
                raise

    # Sort results by frame index to maintain correct order
    all_results.sort(key=lambda x: x['frame'])

    logger.info("Parallel processing finished, total results: %d", len(all_results))
    return all_results


def process_multiple_videos_parallel(
    video_paths: List[str],
    video_sample_rate: int = 1,
    num_workers: Optional[int] = None,
    model_complexity: int = 1
) -> Dict[str, List[Dict]]:
    """
    Process multiple videos in parallel.
    Each video is processed in a separate process.

    Args:
        video_paths: List of paths to video files
        video_sample_rate: Sample rate for frames
        num_workers: Number of parallel workers (defaults to CPU count)
        model_complexity: MediaPipe model complexity

    Returns:
        Dictionary mapping video paths to their landmark results
    """
    if num_workers is None:
        num_workers = min(len(video_paths), mp_sys.cpu_count())

    logger.info("Processing %d videos with %d workers", len(video_paths), num_workers)

    results_dict = {}

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        # Submit all videos for processing
        future_to_path = {
            executor.submit(
                process_video_for_landmarks,
                path,
                video_sample_rate,
                False,  # Don't use nested parallelism
                None,
                model_complexity
            ): path
            for path in video_paths
        }

        # Collect results as they complete
        for future in as_completed(future_to_path):
            video_path = future_to_path[future]
            try:
                results = future.result()
                results_dict[video_path] = results
                logger.info("Completed processing: %s", video_path)
            except Exception as exc:  # pylint: disable=broad-exception-caught
                logger.exception("Error processing video %s: %s", video_path, exc)
                results_dict[video_path] = None

    return results_dict


# New: Render an annotated video with pose landmarks overlaid
# pylint: disable=too-many-locals,too-many-branches,too-many-statements
def render_landmarks_video(
    input_video_path: str,
    output_video_path: Optional[str] = None,
    model_complexity: int = 1,
    use_hw_accel: bool = True,
    use_parallel: bool = True,
    num_workers: Optional[int] = None
) -> str:
    """
    Render pose landmarks onto a copy of the input video and return the output path.
    Uses parallel processing for significant speedup on long videos.

    Args:
        input_video_path: Path to the input video file.
        output_video_path: Optional explicit path for the annotated output.
        model_complexity: MediaPipe model complexity (0=lite, 1=full, 2=heavy).
        use_hw_accel: Use hardware acceleration for ffmpeg encoding if available.
        use_parallel: Use parallel processing for landmark detection (much faster).
        num_workers: Number of parallel workers (defaults to optimal CPU count).

    Returns:
        The path to the annotated output video (MP4).
    """
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Video not found: {input_video_path}")

    logger.info("Rendering landmarks video with parallel=%s", use_parallel)

    # Step 1: Process video for landmarks using parallel processing
    try:
        landmarks_data = process_video_for_landmarks(
            input_video_path,
            video_sample_rate=1,  # Process every frame for video rendering
            use_parallel=use_parallel,
            num_workers=num_workers,
            model_complexity=model_complexity
        )
        logger.info("Landmarks extraction complete, got %d frames", len(landmarks_data))
    except Exception as exc:
        logger.exception("Failed to extract landmarks")
        raise RuntimeError("Failed to extract landmarks for video rendering") from exc

    # Step 2: Open video and prepare output
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

        # Write intermediate file using OpenCV (mp4v), transcode to H.264 for browser
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

        # Custom purple drawing specifications
        landmark_style = drawing_utils.DrawingSpec(
            color=(128, 0, 128),  # Purple color in BGR
            thickness=1,
            circle_radius=2
        )

        connection_style = drawing_utils.DrawingSpec(
            color=(128, 0, 128),  # Purple color in BGR
            thickness=2
        )

        # Create a mapping of frame index to landmarks for fast lookup
        landmarks_by_frame = {entry['frame']: entry['landmarks'] for entry in landmarks_data}
        
        # Import mediapipe landmark format
        from mediapipe.framework.formats import landmark_pb2
        
        # Step 3: Draw landmarks on each frame
        frame_idx = 0
        frames_processed = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Get landmarks for this frame
            if frame_idx in landmarks_by_frame and landmarks_by_frame[frame_idx]:
                landmarks = landmarks_by_frame[frame_idx]
                
                # Convert landmarks back to MediaPipe NormalizedLandmarkList format
                pose_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
                
                for lm in landmarks:
                    landmark = pose_landmarks_proto.landmark.add()
                    landmark.x = float(lm['x'])
                    landmark.y = float(lm['y'])
                    landmark.z = float(lm['z'])
                    if 'visibility' in lm and lm['visibility'] is not None:
                        landmark.visibility = float(lm['visibility'])
                    else:
                        landmark.visibility = 1.0

                # Draw the landmarks on the frame
                drawing_utils.draw_landmarks(
                    frame,
                    pose_landmarks_proto,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=landmark_style,
                    connection_drawing_spec=connection_style
                )
                frames_processed += 1

            writer.write(frame)
            frame_idx += 1

        writer.release()
        logger.info("Drew landmarks on %d/%d frames", frames_processed, frame_idx)

        # Transcode to H.264/AVC for broad browser compatibility
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
        ]

        # Add hardware acceleration if requested
        if use_hw_accel:
            ffmpeg_cmd.extend(["-hwaccel", "auto"])

        ffmpeg_cmd.extend([
            "-i",
            intermediate_path,          # Processed video (no audio)
            "-i",
            input_video_path,            # Original video (with audio)
            "-map",
            "0:v:0",                     # Use video from first input (processed)
            "-map",
            "1:a:0?",                    # Use audio from second input (original), ? = optional
            "-c:v",
            "libx264",
            "-c:a",
            "aac",                       # Encode audio with AAC
            "-preset",
            "fast",                      # Faster encoding
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            output_video_path,
        ])

        try:
            subprocess.run(
                ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            logger.info("Video encoding complete: %s", output_video_path)
        except subprocess.CalledProcessError as exc:
            stderr_msg = exc.stderr.decode(errors='ignore') if exc.stderr else str(exc)
            logger.exception("ffmpeg transcode failed: %s", stderr_msg)
            raise RuntimeError("Failed to transcode annotated video to H.264") from exc
        finally:
            try:
                if os.path.exists(intermediate_path):
                    os.remove(intermediate_path)
            except Exception:  # pylint: disable=broad-exception-caught
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
