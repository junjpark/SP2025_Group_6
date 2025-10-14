import cv2
import mediapipe as mp
import numpy as np
from mediapipe import solutions
from mediapipe.framework.formats import landmark_pb2

# --- STEP 1: DEFINE THE VISUALIZATION FUNCTION (FROM YOUR REFERENCE) ---
def draw_landmarks_on_image(rgb_image, detection_result):
    """Draws pose landmarks on an image."""
    pose_landmarks_list = detection_result.pose_landmarks
    annotated_image = np.copy(rgb_image)

    # Loop through the detected poses to visualize.
    for idx in range(len(pose_landmarks_list)):
        pose_landmarks = pose_landmarks_list[idx]

        # Draw the pose landmarks.
        pose_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
        pose_landmarks_proto.landmark.extend([
            landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z) for landmark in pose_landmarks
        ])
        solutions.drawing_utils.draw_landmarks(
            annotated_image,
            pose_landmarks_proto,
            solutions.pose.POSE_CONNECTIONS,
            solutions.drawing_styles.get_default_pose_landmarks_style())
            
    return annotated_image

# --- STEP 2: SETUP MEDIAPIPE POSE LANDMARKER ---
# Define paths
model_path = 'C:/Users/Parkj/cory/google_test/models/pose_landmarker_full.task'
video_path = './choreo.mp4'  # <-- SET YOUR VIDEO FILE PATH HERE

# Configure MediaPipe options
BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.VIDEO)

# --- STEP 3: RUN THE VIDEO PROCESSING LOOP ---
with PoseLandmarker.create_from_options(options) as landmarker:
    # Load the video
    cap = cv2.VideoCapture(video_path)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video stream.")
            break

        # Convert frame from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Get timestamp and run detection
        timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        results = landmarker.detect_for_video(mp_image, timestamp_ms)

        # Draw the results on the frame
        annotated_image = frame.copy() # Start with the original BGR frame
        if results.pose_landmarks:
            # Call the drawing function on the RGB frame
            annotated_image_rgb = draw_landmarks_on_image(rgb_frame, results)
            # Convert the annotated RGB frame back to BGR for display
            annotated_image = cv2.cvtColor(annotated_image_rgb, cv2.COLOR_RGB2BGR)

        # Display the frame
        cv2.imshow('Pose Landmarking', annotated_image)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()